import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { useReferrals } from '../../hooks/useReferrals';
import { Users, Share2, Download, Copy, QrCode, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface GrowthMetrics {
  coTeacherInvitesSent7d: number;
  coTeacherInvitesAccepted7d: number;
  referralClicks7d: number;
  referralClicksTotal: number;
  lastReferralClicks: Array<{ timestamp: number; code: string }>;
}

export function Growth() {
  const { referrals, loading, refresh: fetchReferrals, createReferral } = useReferrals();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch referrals on component mount
  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Calculate growth metrics from referral data
  const growthMetrics = useMemo((): GrowthMetrics => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Calculate referral clicks in last 7 days
    const referralClicks7d = referrals.reduce((total, referral) => {
      if (referral.lastClickAt && referral.lastClickAt >= sevenDaysAgo) {
        return total + referral.clicks;
      }
      return total;
    }, 0);

    // Calculate total referral clicks
    const referralClicksTotal = referrals.reduce((total, referral) => total + referral.clicks, 0);

    // Get last 30 clicks for table (simulated data since we only have aggregate counts)
    const lastReferralClicks = referrals
      .filter(referral => referral.lastClickAt && referral.lastClickAt >= thirtyDaysAgo)
      .map(referral => ({
        timestamp: referral.lastClickAt!,
        code: referral.code
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 30);

    // TODO: Co-teacher invites would need separate tracking system
    return {
      coTeacherInvitesSent7d: 0, // Placeholder - would need separate tracking
      coTeacherInvitesAccepted7d: 0, // Placeholder - would need separate tracking
      referralClicks7d,
      referralClicksTotal,
      lastReferralClicks
    };
  }, [referrals]);

  const handleCopyReferralLink = async () => {
    try {
      // Get or create a referral link
      let referralUrl = '';
      
      if (referrals.length > 0) {
        // Use existing referral
        referralUrl = referrals[0].url;
      } else {
        // Create new referral
        const newReferral = await createReferral();
        if (!newReferral) {
          return; // Error already shown by createReferral
        }
        referralUrl = newReferral.url;
      }

      await navigator.clipboard.writeText(referralUrl);
      toast({
        kind: 'success',
        text: 'Referral link copied to clipboard!'
      });
    } catch (error) {
      toast({
        kind: 'error',
        text: 'Failed to copy referral link'
      });
    }
  };

  const handlePrintQRPoster = async () => {
    try {
      // Get or create a referral link
      let referralUrl = '';
      
      if (referrals.length > 0) {
        referralUrl = referrals[0].url;
      } else {
        const newReferral = await createReferral();
        if (!newReferral) {
          return;
        }
        referralUrl = newReferral.url;
      }

      // Generate QR code URL using qr-server.com API
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralUrl)}`;
      
      // Create a printable page with QR code
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Quest Island Referral QR Code</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px;
                  margin: 0;
                }
                .qr-container {
                  border: 2px solid #333;
                  padding: 30px;
                  display: inline-block;
                  border-radius: 10px;
                }
                .qr-code {
                  margin: 20px 0;
                }
                h1 { color: #333; margin-bottom: 10px; }
                .subtitle { color: #666; margin-bottom: 30px; }
                .url { 
                  font-family: monospace; 
                  background: #f5f5f5; 
                  padding: 10px; 
                  border-radius: 5px;
                  margin-top: 20px;
                  word-break: break-all;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h1>Quest Island</h1>
                <p class="subtitle">Scan to join your colleague's class!</p>
                <div class="qr-code">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                </div>
                <div class="url">${referralUrl}</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      toast({
        kind: 'error',
        text: 'Failed to generate QR poster'
      });
    }
  };

  const handleSendCoTeacherInvite = () => {
    // TODO: Implement co-teacher invite system
    toast({
      kind: 'info',
      text: 'Co-teacher invite system coming soon!'
    });
  };

  const exportGrowthCsv = () => {
    setIsExporting(true);
    
    try {
      // Generate CSV data with weekly aggregates
      const weeks: Array<{
        week: string;
        referralClicks: number;
        coTeacherInvitesSent: number;
        coTeacherInvitesAccepted: number;
      }> = [];
      const now = Date.now();
      
      // Generate last 12 weeks of data
      for (let i = 11; i >= 0; i--) {
        const weekStart = now - (i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
        
        // Calculate clicks for this week (simplified - real implementation would need more granular data)
        const weekClicks = referrals.reduce((total, referral) => {
          if (referral.lastClickAt && referral.lastClickAt >= weekStart && referral.lastClickAt < weekEnd) {
            return total + referral.clicks;
          }
          return total;
        }, 0);

        weeks.push({
          week: format(new Date(weekStart), 'yyyy-MM-dd'),
          referralClicks: weekClicks,
          coTeacherInvitesSent: 0, // Placeholder
          coTeacherInvitesAccepted: 0 // Placeholder
        });
      }

      // Create CSV content
      const headers = ['week', 'referralClicks', 'coTeacherInvitesSent', 'coTeacherInvitesAccepted'];
      const csvContent = [
        headers.join(','),
        ...weeks.map(week => [
          week.week,
          week.referralClicks,
          week.coTeacherInvitesSent,
          week.coTeacherInvitesAccepted
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth_metrics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        kind: 'success',
        text: 'Growth metrics exported successfully!'
      });
    } catch (error) {
      toast({
        kind: 'error',
        text: 'Failed to export growth metrics'
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-4 subtle">Loading growth metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="growth-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track referrals and co-teacher invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportGrowthCsv}
            disabled={isExporting}
            data-testid="export-growth-csv-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Co-teacher Invites Sent (7d) */}
        <Card data-testid="co-teacher-invites-sent-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-teacher Invites Sent</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.coTeacherInvitesSent7d}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        {/* Co-teacher Invites Accepted (7d) */}
        <Card data-testid="co-teacher-invites-accepted-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-teacher Invites Accepted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.coTeacherInvitesAccepted7d}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        {/* Referral Clicks (7d) */}
        <Card data-testid="referral-clicks-7d-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.referralClicks7d}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        {/* Total Referral Clicks */}
        <Card data-testid="referral-clicks-total-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referral Clicks</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{growthMetrics.referralClicksTotal}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card data-testid="growth-actions-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleCopyReferralLink}
              className="flex items-center gap-2"
              data-testid="copy-referral-link-button"
            >
              <Copy className="h-4 w-4" />
              Copy Referral Link
            </Button>
            <Button 
              variant="outline"
              onClick={handlePrintQRPoster}
              className="flex items-center gap-2"
              data-testid="print-qr-poster-button"
            >
              <QrCode className="h-4 w-4" />
              Print QR Poster
            </Button>
            <Button 
              variant="outline"
              onClick={handleSendCoTeacherInvite}
              className="flex items-center gap-2"
              data-testid="send-co-teacher-invite-button"
            >
              <UserPlus className="h-4 w-4" />
              Send Co-teacher Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referral Clicks Table */}
      <Card data-testid="recent-clicks-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Referral Clicks (Last 30)</CardTitle>
        </CardHeader>
        <CardContent>
          {growthMetrics.lastReferralClicks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No recent referral clicks found</p>
              <p className="text-sm">Share your referral link to start tracking clicks!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="recent-clicks-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Timestamp</th>
                    <th className="text-left py-2 px-3">Referral Code</th>
                  </tr>
                </thead>
                <tbody>
                  {growthMetrics.lastReferralClicks.map((click, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-3" data-testid={`click-timestamp-${index}`}>
                        {format(new Date(click.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="py-2 px-3 font-mono" data-testid={`click-code-${index}`}>
                        {click.code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}