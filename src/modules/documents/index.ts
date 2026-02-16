/**
 * Module Documents Officiels Paroisse
 * Cartes de membres, certificats et diplômes
 *
 * Exports principaux du module
 */

// Types
export type {
  MemberCard,
  MemberCardFormData,
  Certificate,
  CertificateFormData,
  DocumentSettings,
  DocumentSettingsFormData,
} from './types/documents';

// Hooks
export { useMemberCards } from './hooks/useMemberCards';
export { useCertificates } from './hooks/useCertificates';
export { useDocumentSettings } from './hooks/useDocumentSettings';

// Composants
export { MemberCardPreview } from './components/MemberCardPreview';
export { CertificatePreview } from './components/CertificatePreview';
export { MemberCardTable } from './components/MemberCardTable';
export { CertificateTable } from './components/CertificateTable';

// Services
export {
  getMemberCards,
  getMemberCard,
  createMemberCard,
  updateMemberCard,
  deleteMemberCard,
  getCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getDocumentSettings,
  upsertDocumentSettings,
  countMemberCards,
  countCertificates,
} from './services/documentService';

// Styles
import './styles/print.css';
