import React, { PropsWithChildren } from 'react';
import { RosterProvider } from './roster';
import { ProfileProvider } from './profile/context';
import { GuideNoticeProvider } from './guide/notices';
import { ProjectorModeProvider } from './components/ProjectorModeProvider';
import { NpsProvider } from './feedback/NpsProvider';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <RosterProvider>
      <ProfileProvider>
        <ProjectorModeProvider>
          <GuideNoticeProvider>
            <NpsProvider>
              {children}
            </NpsProvider>
          </GuideNoticeProvider>
        </ProjectorModeProvider>
      </ProfileProvider>
    </RosterProvider>
  );
}