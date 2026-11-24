import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPagePath } from '../config/pages';
import { forgetResumeSession, resumeEntryQuery, type ResumeSession } from '../services/applicantSaveService';
import useDeadline from './useDeadline';

export default function useResumeMfaDeadline(session: ResumeSession | null, active = true) {
  const navigate = useNavigate();
  const remaining = useDeadline(session?.sessionExpiresAt);
  useEffect(() => {
    if (active && session && remaining === 0) {
      forgetResumeSession(session.siteKey);
      navigate(`${getPagePath('session-expired')}?${resumeEntryQuery(session.siteKey, session.advisorFlow)}`, { replace: true });
    }
  }, [active, navigate, remaining, session]);
  return remaining;
}
