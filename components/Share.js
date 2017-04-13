import React, {PropTypes} from 'react'

import IconLink from './IconLink'

const ShareButtons = ({url, tweet, emailSubject, emailBody, emailAttachUrl, fill}) => {
  const emailAttache = emailAttachUrl ? `\n\n${url}` : ''
  const shareOptions = [
    {
      target: '_blank',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: 'facebook'
    },
    {
      target: '_blank',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`,
      icon: 'twitter'
    },
    {
      href: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody + emailAttache)}`,
      icon: 'email'
    }
  ]

  return (
    <span>
      {shareOptions.map((props, i) => (
        <IconLink key={i} {...props} fill={fill} />
      ))}
    </span>
  )
}

ShareButtons.propTypes = {
  url: PropTypes.string.isRequired,
  tweet: PropTypes.string.isRequired,
  emailSubject: PropTypes.string.isRequired,
  emailBody: PropTypes.string.isRequired,
  emailAttachUrl: PropTypes.bool.isRequired,
  fill: PropTypes.string
}

ShareButtons.defaultProps = {
  tweet: '',
  emailBody: '',
  emailAttachUrl: true
}

export default ShareButtons