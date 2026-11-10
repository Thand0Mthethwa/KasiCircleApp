import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { Button, Card, Header, LoadingSpinner } from '../components';
import { messagingService } from '../services/api';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('conversation') || '');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [olderPage, setOlderPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const messageRequestId = useRef(0);
  const setSearchParamsRef = useRef(setSearchParams);
  const initialRoute = useRef({
    participantToStart: searchParams.get('participant'),
    requestedConversation: searchParams.get('conversation'),
  });

  const loadMessages = useCallback(async (conversationId, page = 0, append = false) => {
    const requestId = ++messageRequestId.current;
    setIsLoadingMessages(true);
    setError('');
    try {
      const result = await messagingService.getMessages(conversationId, page, 50);
      if (requestId !== messageRequestId.current) return;
      const chronologicalMessages = [...(result.content || [])].reverse();
      setMessages((current) => append
        ? [...chronologicalMessages, ...current]
        : chronologicalMessages);
      setOlderPage(page);
      setTotalPages(result.totalPages || 0);
    } catch (requestError) {
      if (requestId === messageRequestId.current) {
        setError(requestError.data?.message || requestError.message || 'Unable to load messages.');
      }
    } finally {
      if (requestId === messageRequestId.current) setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const { participantToStart, requestedConversation } = initialRoute.current;

    const initialize = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await messagingService.getConversations();
        if (!active) return;
        setConversations(result);

        if (participantToStart) {
          const conversation = await messagingService.createConversation(participantToStart);
          if (!active) return;
          setConversations((current) => [
            conversation,
            ...current.filter((item) => item.id !== conversation.id),
          ]);
          setSelectedId(conversation.id);
          setSearchParamsRef.current({ conversation: conversation.id }, { replace: true });
        } else {
          const existingSelection = result.find((item) => item.id === requestedConversation);
          const selected = existingSelection || result[0];
          if (selected) {
            setSelectedId(selected.id);
            if (selected.id !== requestedConversation) {
              setSearchParamsRef.current({ conversation: selected.id }, { replace: true });
            }
          } else {
            setSelectedId('');
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.data?.message || requestError.message || 'Unable to load conversations.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setMessages([]);
    setOlderPage(0);
    if (selectedId) loadMessages(selectedId);
  }, [loadMessages, selectedId]);

  const selectConversation = (conversationId) => {
    setSelectedId(conversationId);
    setSearchParams({ conversation: conversationId });
    setNotice('');
  };

  const send = async (event) => {
    event.preventDefault();
    if (!selectedId || !messageText.trim()) return;

    setIsSending(true);
    setError('');
    setNotice('');
    try {
      const sentMessage = await messagingService.sendMessage(selectedId, messageText.trim());
      setMessages((current) => [...current, sentMessage]);
      setMessageText('');
      setNotice('Message sent.');
      try {
        setConversations(await messagingService.getConversations());
      } catch {
        setNotice('Message sent. Conversation list could not be refreshed.');
      }
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Unable to send this message.');
    } finally {
      setIsSending(false);
    }
  };

  const loadOlderMessages = () => {
    if (selectedId && olderPage + 1 < totalPages) {
      loadMessages(selectedId, olderPage + 1, true);
    }
  };

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);

  return (
    <div className="page-wrapper pb-8">
      <Header title="Messages" />
      <main className="page-content page-padding py-5 max-w-6xl mx-auto w-full">
        {error && <Card className="mb-4 p-4 text-red-700" role="alert"><AlertCircle className="mr-2 inline" />{error}</Card>}
        {notice && <p className="mb-4 text-green-700" role="status">{notice}</p>}
        {isLoading ? (
          <div role="status" className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid min-h-[65vh] gap-4 md:grid-cols-[minmax(14rem,0.8fr)_2fr]">
            <Card className="overflow-hidden">
              <h2 className="border-b border-neutral-200 p-4 text-lg font-bold">Your conversations</h2>
              {conversations.length ? (
                <ul aria-label="Conversation list" className="divide-y divide-neutral-200">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        aria-current={selectedId === conversation.id ? 'true' : undefined}
                        className={`w-full px-4 py-4 text-left hover:bg-neutral-50 ${selectedId === conversation.id ? 'bg-kasi-green-light' : ''}`}
                        onClick={() => selectConversation(conversation.id)}
                      >
                        <span className="block font-semibold">{conversation.participantName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-5 text-center text-sm text-neutral-600" data-testid="conversation-empty-state">
                  <MessageCircle className="mx-auto mb-2" />
                  <p>No conversations yet.</p>
                  <p className="mt-2">Use the Message button on a worker or job profile to start one.</p>
                </div>
              )}
            </Card>

            <Card className="flex min-h-[65vh] flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  <div className="flex items-center justify-between border-b border-neutral-200 p-4">
                    <h2 className="font-bold">{selectedConversation.participantName}</h2>
                    <Button type="button" variant="secondary" onClick={() => loadMessages(selectedId)} disabled={isLoadingMessages}>
                      <RefreshCw size={16} className="mr-2 inline" />Refresh
                    </Button>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-label="Conversation messages" aria-live="polite">
                    {totalPages > olderPage + 1 && (
                      <div className="text-center">
                        <Button type="button" variant="secondary" onClick={loadOlderMessages} disabled={isLoadingMessages}>
                          Load older messages
                        </Button>
                      </div>
                    )}
                    {isLoadingMessages && messages.length === 0 ? (
                      <div role="status" className="flex justify-center py-8"><LoadingSpinner /></div>
                    ) : messages.length ? messages.map((message) => (
                      <article key={message.id} className="rounded-lg bg-neutral-50 p-3">
                        <p className="text-xs font-semibold text-neutral-600">{message.senderName}</p>
                        <p className="mt-1 whitespace-pre-wrap break-words">{message.content}</p>
                      </article>
                    )) : (
                      <p className="py-8 text-center text-sm text-neutral-600" data-testid="messages-empty-state">
                        No messages yet. Send the first message.
                      </p>
                    )}
                  </div>
                  <form onSubmit={send} className="flex items-end gap-2 border-t border-neutral-200 p-3">
                    <label className="sr-only" htmlFor="message-content">Write a message</label>
                    <textarea
                      id="message-content"
                      className="input-field min-h-12 flex-1 resize-y"
                      maxLength={4000}
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Write a message"
                    />
                    <Button type="submit" disabled={isSending || !messageText.trim()}>
                      <Send size={16} className="mr-2 inline" />{isSending ? 'Sending…' : 'Send'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-neutral-600">
                  <MessageCircle className="mb-2" />
                  <p>Select a conversation to view its messages.</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
