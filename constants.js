const ENV = typeof window !== 'undefined' ? window.__NEXT_DATA__.env : process.env

// ENV variables exported here are sent to the client via pages/_document.js

exports.API_BASE_URL = ENV.API_BASE_URL || 'https://api.satellit.online'
exports.API_WS_BASE_URL = ENV.API_WS_BASE_URL || 'https://api.satellit.online'
exports.API_AUTHORIZATION_HEADER = ENV.API_AUTHORIZATION_HEADER

exports.PUBLIC_BASE_URL = ENV.PUBLIC_BASE_URL
exports.STATIC_BASE_URL = ENV.STATIC_BASE_URL || ENV.PUBLIC_BASE_URL

exports.STRIPE_PUBLISHABLE_KEY = ENV.STRIPE_PUBLISHABLE_KEY

exports.PF_PSPID = ENV.PF_PSPID
exports.PF_FORM_ACTION = ENV.PF_FORM_ACTION

exports.PAYPAL_FORM_ACTION = ENV.PAYPAL_FORM_ACTION
exports.PAYPAL_BUSINESS = ENV.PAYPAL_BUSINESS
exports.PAYPAL_DONATE_LINK = ENV.PAYPAL_DONATE_LINK

exports.PIWIK_URL_BASE = ENV.PIWIK_URL_BASE || 'https://piwik.project-r.construction'
exports.PIWIK_SITE_ID = ENV.PIWIK_SITE_ID || '2'

exports.COUNTDOWN_UTC = ENV.COUNTDOWN_UTC
exports.COUNTDOWN_DATE = ENV.COUNTDOWN_UTC ? new Date(ENV.COUNTDOWN_UTC) : null
exports.COUNTDOWN_NOTE = ENV.COUNTDOWN_NOTE

exports.STATUS_POLL_INTERVAL_MS = ENV.STATUS_POLL_INTERVAL_MS
