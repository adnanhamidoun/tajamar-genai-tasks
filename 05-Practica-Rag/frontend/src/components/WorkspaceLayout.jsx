import { useState } from 'react';
import DocPanel from './DocPanel';
import ThreadChat from './ThreadChat';

/**
 * WorkspaceLayout: panel izquierdo (docs) + panel derecho (thread chat)
 * Para el asistente técnico, oculta el panel de documentos.
 */
export default function WorkspaceLayout({ assistant, isTech, onEdit, onDelete }) {
  const [activeDocuments, setActiveDocuments] = useState([]);

  return (
    <>
      {/* Panel documentos (solo si no es el técnico) */}
      {!isTech && (
        <DocPanel
          assistantId={assistant.id}
          activeDocuments={activeDocuments}
          onActiveDocumentsChange={setActiveDocuments}
        />
      )}

      {/* Chat tipo thread */}
      <ThreadChat
        key={assistant.id}
        assistant={assistant}
        isTech={isTech}
        activeDocuments={activeDocuments}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
