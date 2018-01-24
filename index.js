const express = require('express')
const next = require('next')
const basicAuth = require('express-basic-auth')

const DEV = process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
if (DEV || process.env.DOTENV) {
  require('dotenv').config()
}

const newsletter = require('./server/newsletter')
const COUNTDOWN_DATE = require('./constants').COUNTDOWN_DATE

const PORT = process.env.PORT || 3000

const app = next({dir: '.', dev: DEV})
const handle = app.getRequestHandler()

app.prepare()
.then(() => {
  const server = express()

  if (!DEV) {
    server.enable('trust proxy')
    server.use((req, res, next) => {
      if (`${req.protocol}://${req.get('Host')}` !== process.env.PUBLIC_BASE_URL) {
        return res.redirect(process.env.PUBLIC_BASE_URL + req.url)
      }
      return next()
    })
  }

  if (process.env.BASIC_AUTH_PASS) {
    server.use(basicAuth({
      users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASS },
      challenge: true,
      realm: process.env.BASIC_AUTH_REALM
    }))
  }

  // only attach middle-ware if we're not already past it
  if ((new Date()) < COUNTDOWN_DATE) {
    const ALLOWED_PATHS = [
      '/_next',
      '/_webpack/',
      '/__webpack_hmr',
      '/static/',
      '/newsletter/',
      '/manifest'
    ]

    server.use((req, res, next) => {
      const now = new Date()
      if (now < COUNTDOWN_DATE) {
        const BACKDOOR_URL = process.env.BACKDOOR_URL || ''
        if (req.url === BACKDOOR_URL) {
          res.cookie('OpenSesame', BACKDOOR_URL, { maxAge: 2880000, httpOnly: true })
          return res.redirect('/')
        }

        const cookies = (
          req.headers.cookie &&
          require('cookie').parse(req.headers.cookie)
        ) || {}
        if (
          cookies['OpenSesame'] === BACKDOOR_URL ||
          ALLOWED_PATHS.some(path => req.url.startsWith(path))
        ) {
          return next()
        }

        if (req.url === '/') {
          return app.render(req, res, '/countdown', {})
        }

        req.path = '/404'
        req.url = '/404'
        return handle(req, res)
      }
      return next()
    })
  }

  server.use(newsletter)

  server.get('/verschenken', (req, res) => {
    res.redirect(301, '/pledge?package=ABO_GIVE')
  })
  server.get('/events/:slug', (req, res) => {
    return app.render(req, res, '/events', {
      slug: req.params.slug
    })
  })
  server.get('/updates/wer-sind-sie', (req, res) => {
    return app.render(req, res, '/updates/wer-sind-sie', req.query)
  })
  server.get('/updates/:slug', (req, res) => {
    return app.render(req, res, '/updates', {
      slug: req.params.slug
    })
  })
  server.get('/notifications/:type', (req, res) => {
    return app.render(
      req,
      res,
      '/notifications',
      Object.assign({}, req.query, {
        type: req.params.type
      })
    )
  })
  // PayPal donate return url can be posted to
  server.post('/en', (req, res) => {
    return app.render(req, res, '/en', req.query)
  })
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on port ${PORT}`)
  })
})
