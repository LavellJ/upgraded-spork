import React from 'react';

interface QuickStartPrintProps {
  onClose?: () => void;
}

export function QuickStartPrint({ onClose }: QuickStartPrintProps) {
  const handlePrint = () => {
    // Ensure images are loaded before printing
    const images = document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    
    Promise.all(imagePromises).then(() => {
      // Small delay to ensure styles are applied
      setTimeout(() => {
        window.print();
      }, 100);
    });
  };

  return (
    <div className="print:block">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { 
            margin: 1in; 
            size: letter; 
          }
          
          * { 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            line-height: 1.5 !important;
            color: #1e293b !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .no-print { 
            display: none !important; 
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-page {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 1rem;
          }
          
          .print-logo {
            max-height: 60px;
            margin: 0 auto 1rem auto;
            display: block;
          }
          
          .step-container {
            break-inside: avoid;
            margin-bottom: 1.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
          }
          
          .step-number {
            background: #3b82f6;
            color: white;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 1rem;
            flex-shrink: 0;
          }
          
          .pro-tip {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
          }
          
          .reference-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }
          
          .reference-table th,
          .reference-table td {
            border: 1px solid #e2e8f0;
            padding: 0.5rem;
            text-align: left;
          }
          
          .reference-table th {
            background: #f8fafc;
            font-weight: bold;
          }
        }
        
        @media screen {
          .print-preview {
            max-width: 8.5in;
            margin: 2rem auto;
            padding: 1in;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 11in;
            border: 1px solid #e2e8f0;
          }
          
          /* Ensure content is visible on screen */
          .print-preview * {
            color: inherit !important;
          }
        }
      `}</style>

      {/* Screen Controls */}
      <div className="no-print bg-gray-50 p-4 text-center border-b">
        <h2 className="text-xl font-bold mb-2">LearnOz Teacher Quick Start Guide</h2>
        <p className="text-gray-600 mb-4">Print-ready one-page reference</p>
        <div className="space-x-4">
          <button 
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            data-testid="print-quickstart-button"
          >
            🖨️ Print Guide
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              data-testid="close-print-preview"
            >
              Close Preview
            </button>
          )}
        </div>
      </div>

      {/* Print Content */}
      <div className="print-preview print-page">
        {/* Header */}
        <div className="print-header">
          <img src="/brand/logo.png" alt="LearnOz Logo" className="print-logo" />
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            Teacher Quick Start Guide
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>
            Get your classroom learning in 3 steps
          </p>
        </div>

        {/* Step 1 */}
        <div className="step-container">
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div className="step-number">1</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                Set Up Your Class ⏱️ 2 minutes
              </h2>
            </div>
          </div>
          
          <ol style={{ paddingLeft: '3rem', margin: '0.5rem 0' }}>
            <li><strong>Access the Guide:</strong> Click gear icon (⚙️) → Toggle "Guide Mode"</li>
            <li><strong>Create Your Class:</strong> Guide → Classes → "Add New Class"</li>
            <li><strong>Get Class Code:</strong> Your unique code generates automatically</li>
          </ol>
          
          <div style={{ paddingLeft: '3rem', fontSize: '0.875rem', color: '#059669' }}>
            ✅ <strong>Success Check:</strong> You can see your class code displayed clearly
          </div>
        </div>

        {/* Step 2 */}
        <div className="step-container">
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div className="step-number">2</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                Add Students to Your Class ⏱️ 5 minutes
              </h2>
            </div>
          </div>
          
          <div style={{ paddingLeft: '3rem' }}>
            <p><strong>Option A (Individual):</strong> Share class code → Students visit URL → Create profiles</p>
            <p><strong>Option B (Bulk - Recommended):</strong> Guide → Classes → Import Students → Upload CSV</p>
          </div>
          
          <div style={{ paddingLeft: '3rem', fontSize: '0.875rem', color: '#059669' }}>
            ✅ <strong>Success Check:</strong> Student names appear in your class roster
          </div>
        </div>

        {/* Step 3 */}
        <div className="step-container">
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div className="step-number">3</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                Assign Your First Learning Path ⏱️ 3 minutes
              </h2>
            </div>
          </div>
          
          <ol style={{ paddingLeft: '3rem', margin: '0.5rem 0' }}>
            <li><strong>Choose Content:</strong> Guide → Assignments → "Create New Assignment"</li>
            <li><strong>Select Curriculum:</strong> Mathematics, Science, or Literacy (Years 3-6)</li>
            <li><strong>Set Parameters:</strong> Choose lessons, due dates, assignment notes</li>
            <li><strong>Assign to Class:</strong> Select class → "Assign to Class"</li>
          </ol>
          
          <div style={{ paddingLeft: '3rem', fontSize: '0.875rem', color: '#059669' }}>
            ✅ <strong>Success Check:</strong> Assignment appears in student dashboards
          </div>
        </div>

        {/* Pro Tips */}
        <div className="pro-tip">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#92400e' }}>
            🎯 Pro Tips for Success
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li><strong>Projector Mode:</strong> Guide → Settings → Display → Projector Safe</li>
            <li><strong>Offline Learning:</strong> Content auto-caches, green dot = online status</li>
            <li><strong>Progress Monitor:</strong> Guide → Timeline shows live student activity</li>
          </ul>
        </div>

        {/* Quick Reference */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📱 Quick Reference
          </h3>
          <table className="reference-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Location</th>
                <th>Shortcut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Create Class</td>
                <td>Guide → Classes</td>
                <td>Alt+C</td>
              </tr>
              <tr>
                <td>New Assignment</td>
                <td>Guide → Assignments</td>
                <td>Alt+A</td>
              </tr>
              <tr>
                <td>View Progress</td>
                <td>Guide → Timeline</td>
                <td>Alt+T</td>
              </tr>
              <tr>
                <td>Print QR Code</td>
                <td>Guide → Classes → Print QR</td>
                <td>Alt+Q</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e2e8f0', 
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          <p><strong>Need Help?</strong> Guide → Settings → Documentation • Live Chat Available</p>
          <p>LearnOz Teacher Communications Pack • Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}