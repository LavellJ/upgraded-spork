# Growth Features Documentation

## Overview

LearnOz includes several growth features designed to help teachers expand their reach and build collaborative learning communities. This document covers the implementation details, privacy considerations, and configuration options for all growth-related features.

## Co-teacher Invites

### How It Works

Co-teacher invites allow teachers to collaborate and share classes with other educators. The system enables:

- **Invitation Flow**: Teachers can send invitations to colleagues via email or shareable links
- **Access Control**: Invited co-teachers receive specific permissions to view and interact with shared classes
- **Privacy Protection**: All invitations require explicit consent and can be revoked at any time

### Privacy Notes

- **Data Sharing**: When accepting a co-teacher invite, the invited teacher gains access to:
  - Class roster information (student names and progress data)
  - Assignment and curriculum content
  - Analytics and performance metrics
- **Student Privacy**: Student personal information is limited to educational context only
- **Consent**: All co-teacher relationships require mutual consent from both parties
- **Revocation**: Teachers can revoke co-teacher access at any time through the settings panel

### Implementation Details

```typescript
// Co-teacher invite creation
interface CoTeacherInvite {
  id: string;
  fromTeacherEmail: string;
  toTeacherEmail: string;
  classId: string;
  permissions: 'view' | 'edit' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  createdAt: number;
  expiresAt: number;
}
```

## Referral Links

### What's Shared

Referral links contain minimal tracking information to measure program effectiveness:

- **UTM Parameters**: Campaign tracking for source attribution
  - `utm_source=teacher_referral`
  - `utm_medium=share`
  - `utm_campaign=pilot`
  - `ref=[unique_teacher_code]`
- **No Personal Data**: Links contain no personally identifiable information
- **Anonymous Tracking**: Click metrics are aggregated and anonymized

### UTM Parameter Details

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `utm_source` | `teacher_referral` | Identifies the traffic source as teacher-generated |
| `utm_medium` | `share` | Indicates the medium used for sharing |
| `utm_campaign` | `pilot` | Associates clicks with the pilot program |
| `ref` | `[teacher_code]` | Unique 6-character identifier for attribution |

### QR Poster Template

QR codes are generated using the qr-server.com API with the following specification:

```typescript
// QR Code Generation
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralUrl)}`;

// Poster HTML Template
const posterTemplate = `
<div class="qr-container">
  <h1>Quest Island</h1>
  <p class="subtitle">Scan to join your colleague's class!</p>
  <div class="qr-code">
    <img src="${qrCodeUrl}" alt="QR Code" />
  </div>
  <div class="url">${referralUrl}</div>
</div>
`;
```

### Privacy and Data Collection

- **Click Tracking**: Only aggregated click counts are stored
- **IP Addresses**: Not logged or stored for referral tracking
- **Geographic Data**: No location tracking implemented
- **Retention**: Referral analytics data retained for 12 months maximum

## Share/Rate Prompts

### When They Appear

Share and rate prompts are triggered by specific user actions and time-based conditions:

#### Share Prompt Triggers
- **Milestone Achievement**: Student completes 5+ lessons
- **Class Growth**: Teacher adds 3+ new students
- **Engagement Spike**: 7+ consecutive days of activity
- **Content Creation**: Teacher creates custom assignments

#### Rate Prompt Triggers
- **Extended Usage**: 14+ days of active platform use
- **Feature Utilization**: Uses 3+ major features (assignments, progress tracking, etc.)
- **Session Length**: Completes 30+ minute learning sessions
- **Goal Achievement**: Student reaches curriculum milestone

### Throttling and Frequency

- **Maximum Frequency**: Once per 7 days per prompt type
- **Cooldown Period**: 48 hours between any prompt types
- **Session Limits**: Maximum 1 prompt per user session
- **Dismiss Memory**: Dismissed prompts won't reappear for 30 days

### How to Disable

Prompts can be disabled at multiple levels:

#### 1. Feature Flags (Admin Level)
```typescript
const featureFlags = {
  enableSharePrompt: false,  // Disables all share prompts
  enableRatePrompt: false,   // Disables all rate prompts
};
```

#### 2. User Preferences (Individual Level)
```typescript
const userPreferences = {
  sharePromptsEnabled: false,
  ratePromptsEnabled: false,
  promptFrequency: 'minimal' | 'normal' | 'frequent'
};
```

#### 3. Temporary Suppression
```typescript
// Suppress prompts for current session
window.suppressGrowthPrompts = true;

// Suppress prompts for specific timeframe
localStorage.setItem('promptSuppressedUntil', Date.now() + (7 * 24 * 60 * 60 * 1000));
```

## Feature Flags

### Available Flags

| Flag | Default | Description |
|------|---------|-------------|
| `enableCoTeacherInvites` | `true` | Controls co-teacher invitation functionality |
| `enableReferrals` | `true` | Controls referral link generation and tracking |
| `enableSharePrompt` | `false` | Controls share prompt display (disabled for pilot) |
| `enableRatePrompt` | `false` | Controls rate prompt display (disabled for pilot) |

### Configuration

Feature flags are managed through the admin settings panel and stored in localStorage:

```typescript
// Flag storage structure
interface FeatureFlags {
  enableCoTeacherInvites: boolean;
  enableReferrals: boolean;
  enableSharePrompt: boolean;
  enableRatePrompt: boolean;
}

// Storage key
const FEATURE_FLAGS_KEY = 'learnoz.featureFlags.v1';
```

## Implementation Notes

### Performance Considerations

- **Lazy Loading**: Growth components are loaded only when accessed
- **API Throttling**: Referral creation limited to 5 per hour per user
- **Cache Strategy**: Referral data cached for 5 minutes to reduce server load
- **Image Optimization**: QR codes cached in browser for 1 hour

### Security Measures

- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All user inputs sanitized and validated
- **CSRF Protection**: All forms include CSRF tokens
- **Authentication**: All growth features require valid user authentication

### Analytics and Monitoring

Growth features include comprehensive analytics:

- **Conversion Metrics**: Track invite acceptance rates
- **Engagement Data**: Monitor referral link click-through rates
- **Usage Patterns**: Analyze prompt effectiveness and user responses
- **Performance Monitoring**: Track API response times and error rates

## Troubleshooting

### Common Issues

1. **QR Code Not Generating**
   - Check internet connectivity
   - Verify qr-server.com API availability
   - Ensure referral URL is properly encoded

2. **Referral Links Not Working**
   - Confirm user authentication status
   - Verify database connectivity
   - Check for rate limiting restrictions

3. **Co-teacher Invites Not Sending**
   - Validate email addresses
   - Check spam folder for invite emails
   - Confirm SMTP configuration in development

### Debug Mode

Enable debug logging for growth features:

```typescript
// Enable in browser console
localStorage.setItem('growth.debug', 'true');

// Or set environment variable
GROWTH_DEBUG=true npm run dev
```

## Support and Feedback

For issues related to growth features:

1. Check the browser console for error messages
2. Verify feature flags are enabled for the desired functionality
3. Review the troubleshooting section above
4. Contact technical support with reproduction steps and error logs