'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
const API_URL = "http://localhost:8080";
export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);

  // For now, using test user email - replace with auth context
  const userEmail = "test.hacker@casehacks.ca";
  const userId = "3ede014b-16f9-4728-abf7-1fbf7df55b07"; // Replace with actual user ID from auth context

  const handleScan = async (detectedCodes: any[]) => {
    if (!scanning || detectedCodes.length === 0) return;

    const scannerId = detectedCodes[0].rawValue;
    setScanning(false);

    const result = await scanUser(userEmail, scannerId, userId);

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `✓ ${result.userName} scanned successfully!` 
      });
      setScanCount(prev => prev + 1);
    } else {
      setMessage({ 
        type: 'error', 
        text: result.error || 'Scanning failed' 
      });
    }

    setTimeout(() => {
      setMessage(null);
      setScanning(true);
    }, 2000);
  };
// Make sure to do token stuff later for now just making the endpoint auto hit
  const scanUser = async (originalUserEmail: string, scannerId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/scan/${scannerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_user_id: userId,
        }),
      });

    // Check if response is ok and has content
    if (!response.ok) {
      const text = await response.text();
      console.error('Server error:', response.status, text);
      return { 
        success: false, 
        error: `Server error: ${response.status}` 
      };
    }

    // Check if response has content
    const text = await response.text();
    if (!text) {
      return { 
        success: false, 
        error: 'Empty response from server' 
      };
    }

    const result = JSON.parse(text);
      return result;
    } catch (error) {
      console.error("Error scanning user:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-8">Hacker to Hacker Scanner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-4">

            {/* Scanner */}
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Scanner</h2>
                <>
                  {!scanning ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => setScanning(true)}
                        className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start Scanning
                      </button>
                      {message && (
                        <div className={`p-4 rounded-lg ${
                          message.type === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <p className={`text-sm font-medium ${
                            message.type === 'success' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {message.text}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                        <Scanner
                          onScan={handleScan}
                          onError={(error) => {
                            console.error('Scanner error:', error);
                            setMessage({ type: 'error', text: 'Scanner error occurred' });
                          }}
                          components={{
                            finder: true,
                          }}
                          styles={{
                            container: { width: '100%', height: '100%' },
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setScanning(false);
                          setMessage(null);
                        }}
                        className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Stop Scanning
                      </button>
                      <p className="text-sm text-center text-foreground/60">
                        Position the QR code within the scanner frame
                      </p>
                    </div>
                  )}
                </>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
