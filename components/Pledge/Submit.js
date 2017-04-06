import React, {Component, PropTypes} from 'react'
import SignIn from '../Auth/SignIn'
import { gql, graphql } from 'react-apollo'
import Router from 'next/router'
import FieldSet from '../FieldSet'
import {mergeFields} from '../../lib/utils/fieldState'
import {compose} from 'redux'
import {InlineSpinner} from '../Spinner'
import withT from '../../lib/withT'

import {
  H2, P, Button,
  colors
} from '@project-r/styleguide'

const PAYMENT_METHODS = [
  {disabled: true, key: 'PAYMENTSLIP'},
  {disabled: false, key: 'STRIPE'},
  {disabled: true, key: 'POSTFINANCECARD'},
  {disabled: true, key: 'PAYPAL'}
]

const errorToString = error => error.graphQLErrors && error.graphQLErrors.length
  ? error.graphQLErrors.map(e => e.message).join(', ')
  : error.toString()

const objectValues = (object) => Object.keys(object).map(key => object[key])
const simpleHash = (object, delimiter = '|') => {
  return objectValues(object).map(value => {
    if (value && typeof value === 'object') {
      return simpleHash(value, delimiter === '|' ? '$' : `$${delimiter}`)
    }
    return `${value}`
  }).join(delimiter)
}

class Submit extends Component {
  constructor (props) {
    super(props)
    this.state = {
      emailFree: true,
      values: {},
      errors: {},
      dirty: {},
      loading: false
    }
    this.amountRefSetter = (ref) => {
      this.amountRef = ref
    }
  }
  submitPledge () {
    const {me, user, total, options, reason, t} = this.props

    const variables = {
      total,
      options,
      reason,
      user: me ? null : user
    }
    const hash = simpleHash(variables)

    if (!this.state.submitError && hash === this.state.pledgeHash) {
      this.payPledge(this.state.pledgeId)
      return
    }

    this.setState(() => ({
      loading: t('pledge/submit/loading/submit')
    }))
    this.props.submit(variables)
      .then(({data}) => {
        this.setState(() => ({
          loading: false,
          pledgeId: data.submitPledge.id,
          pledgeHash: hash,
          submitError: undefined
        }))
        this.payPledge(data.submitPledge.id)
      })
      .catch(error => {
        console.error('submit', error)
        const submitError = errorToString(error)

        // TODO: Better Backend Error
        if (submitError === 'a user with the email adress pledge.user.email already exists, login!') {
          this.setState(() => ({
            loading: false,
            emailFree: false
          }))
          return
        }

        this.setState(() => ({
          loading: false,
          pledgeId: undefined,
          pledgeHash: undefined,
          submitError
        }))
      })
  }
  payPledge (pledgeId) {
    const {me, user, t} = this.props
    const {values} = this.state

    this.setState(() => ({
      loading: t('pledge/submit/loading/stripe')
    }))
    window.Stripe.setPublishableKey('pk_test_sgFutulewhWC8v8csVIXTMea')
    window.Stripe.source.create({
      type: 'card',
      currency: 'CHF',
      usage: 'reusable',
      card: {
        number: values.cardNumber,
        cvc: values.cardCVC,
        exp_month: values.cardMonth,
        exp_year: values.cardYear
      }
    }, (status, source) => {
      console.log('stripe', status, source)
      if (status !== 200) {
        // source.error.type
        // source.error.param
        // source.error.message
        // see https://stripe.com/docs/api#errors
        this.setState(() => ({
          loading: false,
          paymentError: source.error.message
        }))
        return
      }
      this.setState({
        loading: false,
        paymentError: undefined
      })

      // TODO implement 3D secure
      if (source.card.three_d_secure === 'required') {
        window.alert('Cards requiring 3D secure are not supported yet.')
        return
      }

      this.setState(() => ({
        loading: t('pledge/submit/loading/pay')
      }))
      this.props.pay({
        pledgeId,
        method: 'STRIPE',
        sourceId: source.id,
        pspPayload: JSON.stringify(source)
      })
        .then(({data}) => {
          const gotoMerci = () => {
            Router.push({
              pathname: '/merci',
              query: {
                id: data.payPledge.id,
                email: me ? me.email : user.email
              }
            })
          }
          if (!me) {
            this.props.signIn(user.email)
              .then(() => gotoMerci())
              .catch(error => {
                console.error('signIn', error)
                this.setState(() => ({
                  loading: false,
                  signInError: errorToString(error)
                }))
              })
          } else {
            gotoMerci()
          }
        })
        .catch(error => {
          console.error('pay', error)
          this.setState(() => ({
            loading: false,
            paymentError: errorToString(error)
          }))
        })
    })
  }
  render () {
    const {
      emailFree,
      paymentMethod,
      paymentError,
      submitError,
      signInError,
      loading
    } = this.state
    const {me, user, t} = this.props

    const errors = objectValues(this.props.errors)
      .concat(objectValues(this.state.errors))
      .concat(!paymentMethod && 'Zahlungsart auswählen')
      .filter(Boolean)

    return (
      <div>
        <H2>{t('pledge/submit/pay/title')}</H2>
        <P>
          {PAYMENT_METHODS.map((pm) => (
            <span key={pm.key} style={{opacity: pm.disabled ? 0.5 : 1}}>
              <label>
                <input
                  type='radio'
                  name='paymentMethod'
                  disabled={pm.disabled}
                  onChange={(event) => {
                    const value = event.target.value
                    this.setState(() => ({
                      showErrors: false,
                      paymentMethod: value
                    }))
                  }}
                  value={pm.key} />
                {' '}{t(`pledge/submit/pay/method/${pm.key}`)}
              </label><br />
            </span>
          ))}
        </P>

        {(paymentMethod === 'STRIPE') && (
          <div>
            <FieldSet
              values={this.state.values}
              errors={this.state.errors}
              dirty={this.state.dirty}
              fields={[
                {
                  label: t('pledge/submit/stripe/card/label'),
                  name: 'cardNumber',
                  mask: '1111 1111 1111 1111',
                  validator: (value) => (
                    (
                      !value &&
                      t('pledge/submit/stripe/card/error/empty')
                    ) || (
                      !window.Stripe.card.validateCardNumber(value) &&
                      t('pledge/submit/stripe/card/error/invalid')
                    )
                  )
                },
                {
                  label: t('pledge/submit/stripe/month/label'),
                  name: 'cardMonth'
                },
                {
                  label: t('pledge/submit/stripe/year/label'),
                  name: 'cardYear'
                },
                {
                  label: t('pledge/submit/stripe/cvc/label'),
                  name: 'cardCVC',
                  validator: (value) => (
                    (
                      !value &&
                      t('pledge/submit/stripe/cvc/error/empty')
                    ) || (
                      !window.Stripe.card.validateCVC(value) &&
                      t('pledge/submit/stripe/cvc/error/invalid')
                    )
                  )
                }
              ]}
              onChange={(fields) => {
                this.setState((state) => {
                  const nextState = mergeFields(fields)(state)

                  const month = nextState.values.cardMonth
                  const year = nextState.values.cardYear

                  if (
                    year && month &&
                    nextState.dirty.cardMonth &&
                    nextState.dirty.cardYear &&
                    !window.Stripe.card.validateExpiry(month, year)
                  ) {
                    nextState.errors.cardMonth = t('pledge/submit/stripe/month/error/invalid')
                    nextState.errors.cardYear = t('pledge/submit/stripe/year/error/invalid')
                  } else {
                    nextState.errors.cardMonth = (
                      !month && t('pledge/submit/stripe/month/error/empty')
                    )
                    nextState.errors.cardYear = (
                      !year && t('pledge/submit/stripe/year/error/empty')
                    )
                  }

                  return nextState
                })
              }} />
            <br /><br />
          </div>
        )}

        {(!emailFree && !me) && (
          <div style={{marginBottom: 40}}>
            <P>{t('pledge/submit/emailVerify/note')}</P>
            <SignIn email={user.email} />
          </div>
        )}
        {!!submitError && (
          <P style={{color: colors.error}}>
            {submitError}
          </P>
        )}
        {!!paymentError && (
          <P style={{color: colors.error}}>
            {paymentError}
          </P>
        )}
        {!!signInError && (
          <P style={{color: colors.error}}>
            {signInError}
          </P>
        )}
        {loading ? (
          <div style={{textAlign: 'center'}}>
            <InlineSpinner />
            <br />
            {loading}
          </div>
        ) : (
          <div>
            {!!this.state.showErrors && errors.length > 0 && (
              <P style={{color: colors.error}}>
                {t('pledge/submit/error/title')}<br />
                <ul>
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </P>
            )}
            <div style={{opacity: errors.length ? 0.5 : 1}}>
              <Button
                onClick={() => {
                  if (errors.length) {
                    this.props.onError()
                    this.setState((state) => {
                      const dirty = {
                        ...state.dirty
                      }
                      Object.keys(state.errors).forEach(field => {
                        if (state.errors[field]) {
                          dirty[field] = true
                        }
                      })
                      return {
                        dirty,
                        showErrors: true
                      }
                    })
                  } else {
                    this.submitPledge()
                  }
                }}>
                {t('pledge/submit/button/pay')}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
}

Submit.propTypes = {
  me: PropTypes.object,
  user: PropTypes.object,
  total: PropTypes.number,
  reason: PropTypes.string,
  options: PropTypes.array.isRequired,
  submit: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired
}

const submitPledge = gql`
  mutation submitPledge($total: Int!, $options: [PackageOptionInput!]!, $user: UserInput, $reason: String) {
    submitPledge(pledge: {total: $total, options: $options, user: $user, reason: $reason}) {
      id
    }
  }
`

const payPledge = gql`
  mutation payPledge($pledgeId: ID!, $method: PaymentMethod!, $sourceId: String, $pspPayload: String!) {
    payPledge(pledgePayment: {pledgeId: $pledgeId, method: $method, sourceId: $sourceId, pspPayload: $pspPayload}) {
      id
    }
  }
`

const signInMutation = gql`
mutation signIn($email: String!) {
  signIn(email: $email) {
    phrase
  }
}
`

const SubmitWithMutations = compose(
  graphql(submitPledge, {
    props: ({mutate}) => ({
      submit: variables => mutate({variables})
    })
  }),
  graphql(payPledge, {
    props: ({mutate}) => ({
      pay: variables => mutate({variables})
    })
  }),
  graphql(signInMutation, {
    props: ({mutate}) => ({
      signIn: email => mutate({variables: {email}})
    })
  }),
  withT
)(Submit)

export default SubmitWithMutations