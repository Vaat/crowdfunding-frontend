import React from 'react'
import {gql, graphql} from 'react-apollo'
import {compose} from 'redux'
import {timeDay} from 'd3-time'
import Link from 'next/link'

import Loader from '../Loader'
import Meta from '../Frame/Meta'

import withT from '../../lib/withT'
import {parseDate} from '../../lib/utils/formats'

import {
  Interaction, linkRule
} from '@project-r/styleguide'

import {
  PUBLIC_BASE_URL
} from '../../constants'

import Event from './Detail'

const {H2} = Interaction

const query = gql`
query {
  events {
    slug
    title
    description
    metaDescription
    link
    date
    time
    where
    locationLink
  }
}
`

const Overview = compose(
  withT,
  graphql(query, {
    props: ({ data, ownProps: {slug, t, serverContext} }) => {
      let error = data.error
      let event
      if (slug && data.events && !error) {
        event = data.events.find(event => (
          event.slug === slug
        ))
        if (!event) {
          error = t('events/404')
          if (serverContext) {
            serverContext.res.statusCode = 404
          }
        }
      }
      return {
        loading: data.loading,
        events: data.events,
        error,
        event
      }
    }
  })
)(({events, event, t, loading, error}) => (
  <Loader loading={loading} error={error} render={() => {
    if (event) {
      return (
        <div>
          <Meta data={{
            title: event.title,
            description: event.metaDescription,
            url: `${PUBLIC_BASE_URL}/events/${event.slug}`,
            image: `${PUBLIC_BASE_URL}/static/social-media/events.png`
          }} />
          <Event data={event} />
          <Link href='/events'>
            <a {...linkRule}>{t('events/all')}</a>
          </Link>
        </div>
      )
    }

    const today = timeDay.floor(new Date())
    const upcoming = events.filter(event => {
      return today <= parseDate(event.date)
    })
    const past = events.filter(event => {
      return today > parseDate(event.date)
    })
    return (
      <div>
        <Meta data={{
          title: t('events/pageTitle'),
          description: t('events/metaDescription'),
          url: `${PUBLIC_BASE_URL}/events`,
          image: `${PUBLIC_BASE_URL}/static/social-media/events.png`
        }} />
        {!!upcoming.length && (
          <H2 style={{marginBottom: 15}}>
            {t('events/upcoming')}
          </H2>
        )}
        {upcoming.map(event => (
          <Event key={event.slug} data={event} />
        ))}
        {!!past.length && (
          <H2 style={{marginBottom: 15}}>
            {t('events/past')}
          </H2>
        )}
        {past.map(event => (
          <Event key={event.slug} data={event} />
        ))}
      </div>
    )
  }} />
))

export default Overview