import React from 'react'
import {gql, graphql} from 'react-apollo'
import {css} from 'glamor'
import {compose} from 'redux'
import Head from 'next/head'

import withT from '../../lib/withT'

import Loader from '../Loader'

import {
  P, Interaction, Logo, fontFamilies
} from '@project-r/styleguide'

const styles = {
  container: css({
    position: 'relative',
    width: 1200,
    height: 628,
    backgroundColor: '#fff'
  }),
  logo: css({
    position: 'absolute',
    left: 628 + 50,
    right: 50,
    bottom: 50
  }),
  image: css({
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 628
  }),
  text: css({
    position: 'absolute',
    top: 50,
    left: 628 + 50,
    right: 50,
    bottom: 50 + 120,
    wordWrap: 'break-word'
  }),
  quote: css({
    fontSize: 27,
    lineHeight: 1.42
  }),
  number: css({
    fontSize: 30,
    fontFamily: fontFamilies.sansSerifMedium
  }),
  videoTitle: css({
    fontSize: 60,
    lineHeight: '75px',
    marginBottom: 20
  })
}

const fontSizeBoost = length => {
  if (length < 40) {
    return 26
  }
  if (length < 50) {
    return 17
  }
  if (length < 80) {
    return 8
  }
  if (length < 100) {
    return 4
  }
  if (length > 400) {
    return -2
  }
  return 0
}

const Item = ({loading, error, t, testimonial: {quote, image, name, video, sequenceNumber}}) => (
  <Loader loading={loading} error={error} render={() => (
    <div {...styles.container}>
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      <img {...styles.image} src={image} />
      <div {...styles.text}>
        {video && (
          <Interaction.H2 {...styles.videoTitle}>
            {name}
          </Interaction.H2>
        )}
        {quote && <P {...styles.quote}
          style={{fontSize: 24 + fontSizeBoost(quote.length)}}>
          «{quote}»
        </P>}
        {!!sequenceNumber && (
          <div {...styles.number}>{t('memberships/sequenceNumber/label', {
            sequenceNumber
          })}</div>
        )}
      </div>
      <div {...styles.logo}>
        <Logo />
      </div>
    </div>
  )} />
)

const query = gql`query testimonials($firstId: ID) {
  testimonials(firstId: $firstId, limit: 1) {
    id
    name
    role
    quote
    image(size: SHARE)
    sequenceNumber
    video {
      hls
      mp4
      youtube
    }
  }
}`

export default compose(
  withT,
  graphql(query, {
    props: ({data, ownProps: {name}}) => {
      return ({
        loading: data.loading,
        error: data.error,
        testimonial: data.testimonials && data.testimonials[0]
      })
    }
  })
)(Item)
