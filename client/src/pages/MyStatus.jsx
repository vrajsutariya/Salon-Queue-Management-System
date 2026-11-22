import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const MyStatus = () => {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicket = async () => {
    try {
      const data = await api.getTicketStatus(id);
      if (data.success) {
        setTicketData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching ticket status:', err);
      setError('Ticket not found or network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    const handleQueueUpdated = () => {
      fetchTicket();
    };

    socket.on('queue:updated', handleQueueUpdated);

    const interval = setInterval(fetchTicket, 15000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      clearInterval(interval);
    };
  }, [id]);

  const ticket = ticketData?.ticket;
  const position = ticketData?.position ?? 1;
  const waitMinutes = ticketData?.estimatedWaitTimeMinutes ?? 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <span className="badge badge-status-waiting fs-6 px-3 py-2">{t('status_WAITING')}</span>;
      case 'called':
        return <span className="badge badge-status-called fs-6 px-3 py-2">{t('status_CALLED')}</span>;
      case 'in-chair':
        return <span className="badge badge-status-in-chair fs-6 px-3 py-2">{t('status_IN_CHAIR')}</span>;
      case 'done':
        return <span className="badge badge-status-done fs-6 px-3 py-2">{t('status_DONE')}</span>;
      case 'no-show':
        return <span className="badge badge-status-noshow fs-6 px-3 py-2">{t('status_NO_SHOW')}</span>;
      default:
        return <span className="badge bg-secondary fs-6 px-3 py-2">{status}</span>;
    }
  };

  return (
    <div className="container py-4 animate-fade-in-up">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="salon-card p-4 text-center">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge badge-gold px-3 py-1 rounded-pill">Screen 3 • Live Ticket</span>
              <button onClick={fetchTicket} className="btn btn-sm btn-outline-secondary py-1 px-2" title="Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>

            {loading ? (
              <div className="py-5">
                <div className="spinner-border text-warning mb-2" role="status"></div>
                <p className="text-muted small">Loading ticket status...</p>
              </div>
            ) : error || !ticket ? (
              <div className="py-4">
                <i className="bi bi-exclamation-circle text-warning display-4 mb-3"></i>
                <h5 className="text-white">Ticket Not Found</h5>
                <p className="text-muted small">Could not locate ticket details for ID: {id}</p>
                <Link to="/join" className="btn btn-gold mt-2">
                  Join Queue
                </Link>
              </div>
            ) : (
              <>
                <h3 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
                  {ticket.token}
                </h3>
                <p className="lead text-white fw-semibold mb-1">{ticket.customerName}</p>
                <p className="text-muted small mb-4">Phone: +91 {ticket.phone}</p>

                {ticket.status === 'called' && (
                  <div className="alert alert-primary py-3 mb-4 animate-fade-in-up" style={{ backgroundColor: 'var(--status-called-bg)', borderColor: 'var(--status-called)' }}>
                    <h5 className="alert-heading fw-bold mb-1" style={{ color: 'var(--status-called)' }}>
                      <i className="bi bi-bell-fill me-2"></i>You are being called!
                    </h5>
                    <p className="mb-0 text-white small">Please proceed to the styling chair. Your barber is waiting for you.</p>
                  </div>
                )}

                <div className="py-4 px-3 mb-4 rounded" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                  <div className="mb-3">{getStatusBadge(ticket.status)}</div>

                  {ticket.status === 'waiting' && (
                    <>
                      <div className="display-4 fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
                        #{position}
                      </div>
                      <p className="text-muted mb-3">Your Position in Line</p>
                      <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-dark border border-secondary">
                        <i className="bi bi-clock-history text-warning"></i>
                        <span className="text-white fw-bold">~{waitMinutes} {t('minutes')}</span>
                        <span className="text-muted small">est. wait</span>
                      </div>
                    </>
                  )}

                  {ticket.status === 'in-chair' && (
                    <div className="text-success my-2">
                      <i className="bi bi-scissors fs-1 d-block mb-2"></i>
                      <h5 className="fw-bold">Service In Progress</h5>
                      <p className="text-muted small mb-0">Enjoy your session with your stylist.</p>
                    </div>
                  )}

                  {ticket.status === 'done' && (
                    <div className="text-muted my-2">
                      <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-2"></i>
                      <h5 className="fw-bold text-white">Service Completed</h5>
                      <p className="text-muted small mb-0">Thank you for visiting Crown & Blade!</p>
                    </div>
                  )}
                </div>

                {/* Selected Services Info */}
                <div className="text-start p-3 rounded mb-4" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
                  <span className="small text-muted d-block mb-2 fw-semibold">Services Requested:</span>
                  <div className="d-flex flex-wrap gap-2">
                    {ticket.services?.map((srv) => (
                      <span key={srv._id || srv} className="badge bg-secondary">
                        {srv.name?.[lang] || srv.name?.en || srv.name || 'Service'} (₹{srv.priceInr})
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-top border-secondary d-flex justify-content-between small text-muted">
                    <span>Preferred Barber:</span>
                    <span className="text-white fw-semibold">{ticket.preferredBarber === 'any' ? t('fastestAvailable') : ticket.preferredBarber}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between gap-2">
                  <Link to="/" className="btn btn-outline-gold flex-grow-1">
                    <i className="bi bi-house me-1"></i> {t('home')}
                  </Link>
                  <Link to="/join" className="btn btn-sm btn-outline-secondary d-flex align-items-center">
                    New Ticket
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
