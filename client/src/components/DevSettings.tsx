import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function DevSettings() {
  const [tokenInput, setTokenInput] = useState('');

  const handleSetToken = () => {
    if (!tokenInput.trim()) {
      alert('Please enter a token');
      return;
    }

    const authData = {
      enabled: true,
      verified: true,
      token: tokenInput.trim(),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
      updatedAt: Date.now()
    };

    localStorage.setItem('qi.auth.v1', JSON.stringify(authData));
    alert('Token set successfully');
    setTokenInput('');
  };

  const handleClearToken = () => {
    localStorage.removeItem('qi.auth.v1');
    alert('Token cleared');
  };

  const getCurrentToken = () => {
    try {
      const authData = localStorage.getItem('qi.auth.v1');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || 'No token found';
      }
    } catch (e) {
      return 'Invalid auth data';
    }
    return 'No auth data';
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Dev Settings - Auth Token</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Set JWT Token:
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter JWT token..."
              className="flex-1"
              data-testid="input-token"
            />
            <Button 
              onClick={handleSetToken}
              data-testid="button-set-token"
            >
              Set Token
            </Button>
          </div>
        </div>

        <div>
          <Button 
            onClick={handleClearToken}
            variant="outline"
            data-testid="button-clear-token"
          >
            Clear Token
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <strong>Current token:</strong>
          <div className="mt-1 p-2 bg-white border rounded text-xs font-mono break-all">
            {getCurrentToken()}
          </div>
        </div>
      </div>
    </div>
  );
}