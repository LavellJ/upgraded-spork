import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Chip } from '../components/ui/chip';
import { Toolbar } from '../components/ui/toolbar';
import { useReferrals, type Referral } from '../hooks/useReferrals';
import { useToast } from '../hooks/use-toast';
import { InlineError } from '../components/ui/inline-error';
import { generateQRDataURL } from '../utils/qr';
import { Copy, QrCode, Plus, Trash2, ExternalLink, Users, TrendingUp } from 'lucide-react';

export default function GrowthSettings() {
  const { referrals, loading, error, createReferral, deleteReferral, refresh } = useReferrals();
  const { toast } = useToast();
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  const handleCreateReferral = async () => {
    await createReferral();
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        kind: 'success',
        text: 'Referral link copied to clipboard!'
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        kind: 'error',
        text: 'Failed to copy link. Please try again.'
      });
    }
  };

  const handleDeleteReferral = async (code: string) => {
    setDeletingCode(code);
    try {
      await deleteReferral(code);
    } finally {
      setDeletingCode(null);
    }
  };

  const handleShowQR = (referral: Referral) => {
    setShowQR(referral.code);
  };

  const handlePrintQR = (referral: Referral) => {
    const qrDataURL = generateQRDataURL(referral.url, { size: 300 });
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>LearnOz Teacher Referral QR Code</title>
          <style>
            @page { margin: 1in; size: letter; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0;
              line-height: 1.5;
              text-align: center;
            }
            .header { margin-bottom: 2rem; }
            .logo { font-size: 2rem; font-weight: bold; color: #1e293b; margin-bottom: 0.5rem; }
            .subtitle { color: #64748b; font-size: 1.1rem; }
            .qr-container { margin: 2rem 0; }
            .qr-code { border: 2px solid #e2e8f0; border-radius: 8px; padding: 1rem; display: inline-block; }
            .info { background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; }
            .url { font-family: monospace; background: #f1f5f9; padding: 0.5rem; border-radius: 4px; word-break: break-all; }
            .footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #64748b; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🎓 LearnOz</div>
            <div class="subtitle">Teacher Referral Program</div>
          </div>

          <div class="info">
            <h1 style="margin: 0 0 0.5rem 0; color: #1e293b;">Join LearnOz</h1>
            <p style="margin: 0; color: #64748b;">Scan to explore AI-powered learning for the Australian curriculum</p>
          </div>

          <div class="qr-container">
            <div class="qr-code">
              <img src="${qrDataURL}" alt="LearnOz Referral QR Code" style="display: block;">
            </div>
          </div>

          <div class="info">
            <p><strong>Your referral link:</strong></p>
            <div class="url">${referral.url}</div>
            <p style="margin-top: 1rem; color: #64748b; font-size: 0.9rem;">
              Referral Code: <strong>${referral.code}</strong>
            </p>
          </div>

          <div style="margin: 2rem 0; padding: 1rem; background: #fef3c7; border-radius: 8px;">
            <h3 style="margin: 0 0 0.5rem 0; color: #92400e;">Share with Fellow Educators</h3>
            <p style="margin: 0; color: #92400e;">Help other teachers discover AI-powered learning tools that adapt to each student's needs!</p>
          </div>

          <div class="footer">
            <p>Learn more about LearnOz at ${window.location.origin}</p>
            <p style="font-size: 0.875rem;">LearnOz Teacher Growth Program • Generated ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastClickText = (lastClickAt: number | null) => {
    if (!lastClickAt) return 'Never';
    return formatDate(lastClickAt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Growth & Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-[rgb(var(--fg-muted))]">
              Help grow the LearnOz pilot program by sharing your referral link with fellow educators. 
              Track clicks and see how your referrals are performing.
            </p>
            
            <div className="flex items-center gap-4 p-4 bg-[rgb(var(--bg-soft))] rounded-lg border border-[rgb(var(--border))]">
              <TrendingUp className="w-5 h-5 text-[rgb(var(--fg-accent))]" />
              <div>
                <div className="font-medium">Pilot Growth Program</div>
                <div className="text-sm text-[rgb(var(--fg-muted))]">
                  Share LearnOz with other teachers and help build the future of AI-powered education
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <InlineError message={error} onRetry={refresh} />
      )}

      {/* Create Referral */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-[rgb(var(--fg-muted))]">
              Generate a unique referral link to share LearnOz with other teachers. 
              You can track clicks and engagement for each link.
            </p>
            
            <Button
              onClick={handleCreateReferral}
              disabled={loading}
              className="w-full md:w-auto"
              data-testid="button-create-referral"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create New Referral Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div 
                  key={referral.code}
                  className="p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg-card))]"
                  data-testid={`referral-${referral.code}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-medium">
                          {referral.code}
                        </span>
                        <Chip kind="info">
                          {referral.clicks} clicks
                        </Chip>
                      </div>
                      
                      <div className="text-sm text-[rgb(var(--fg-muted))] mb-3 font-mono bg-[rgb(var(--bg-soft))] p-2 rounded border border-[rgb(var(--border))] word-break-all">
                        {referral.url}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[rgb(var(--fg-muted))]">
                        <div>
                          <Users className="w-3 h-3 inline mr-1" />
                          Created: {formatDate(referral.createdAt)}
                        </div>
                        <div>
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          Last click: {getLastClickText(referral.lastClickAt)}
                        </div>
                      </div>
                    </div>
                    
                    <Toolbar
                      right={
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(referral.url)}
                            title="Copy link"
                            data-testid={`button-copy-${referral.code}`}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowQR(referral)}
                            title="Show QR code"
                            data-testid={`button-qr-${referral.code}`}
                          >
                            <QrCode className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(referral.url, '_blank')}
                            title="Open link"
                            data-testid={`button-open-${referral.code}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReferral(referral.code)}
                            disabled={deletingCode === referral.code}
                            title="Delete referral"
                            data-testid={`button-delete-${referral.code}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(null)}>
          <div className="bg-[rgb(var(--bg-card))] p-6 rounded-lg border border-[rgb(var(--border))] max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">QR Code</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQR(null)}
                >
                  ✕
                </Button>
              </div>
              
              {(() => {
                const referral = referrals.find(r => r.code === showQR);
                if (!referral) return null;
                
                const qrDataURL = generateQRDataURL(referral.url, { size: 250 });
                
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <img 
                        src={qrDataURL} 
                        alt="Referral QR Code" 
                        className="mx-auto border border-[rgb(var(--border))] rounded p-2 bg-white"
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="font-mono text-sm mb-2">{referral.code}</div>
                      <div className="text-xs text-[rgb(var(--fg-muted))] mb-4">
                        Scan to visit: {referral.url}
                      </div>
                    </div>
                    
                    <Toolbar
                      left={
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(referral.url)}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy Link
                        </Button>
                      }
                      right={
                        <Button
                          size="sm"
                          onClick={() => handlePrintQR(referral)}
                        >
                          Print QR Poster
                        </Button>
                      }
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && referrals.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-[rgb(var(--fg-muted))]">Loading referrals...</div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && referrals.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <TrendingUp className="w-12 h-12 mx-auto text-[rgb(var(--fg-muted))]" />
              <div>
                <div className="font-medium mb-2">No referral links yet</div>
                <div className="text-[rgb(var(--fg-muted))] mb-4">
                  Create your first referral link to start sharing LearnOz with other teachers.
                </div>
                <Button
                  onClick={handleCreateReferral}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Referral Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}