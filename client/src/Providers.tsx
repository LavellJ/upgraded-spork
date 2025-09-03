import React, { PropsWithChildren } from 'react';
import { RosterProvider } from '@/roster';
import { ProfileProvider } from './profile/context';
import { GuideNoticeProvider } from './guide/notices';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <RosterProvider>
      <ProfileProvider>
        <GuideNoticeProvider>
          {children}
        </GuideNoticeProvider>
      </ProfileProvider>
    </RosterProvider>
  );
}