import React, { PropsWithChildren } from 'react';
import { RosterProvider } from '@/roster';
import { ProfileProvider } from './profile/context';
import { GuideNoticeProvider } from './guide/notices';
import { ProjectorModeProvider } from './components/ProjectorModeProvider';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <RosterProvider>
      <ProfileProvider>
        <ProjectorModeProvider>
          <GuideNoticeProvider>
            {children}
          </GuideNoticeProvider>
        </ProjectorModeProvider>
      </ProfileProvider>
    </RosterProvider>
  );
}