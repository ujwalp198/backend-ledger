import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('nexus_token'));
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [accountId, setAccountId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [txType, setTxType] = useState('DEPOSIT');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [receiptNotice, setReceiptNotice] = useState(null);
  
  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      
      try {
        const accRes = await api.get('/accounts');
        if (accRes.data.accounts && accRes.data.accounts.length > 0) {
          const acc = accRes.data.accounts[0];
          setAccountId(acc._id);
          
          const txRes = await api.get(`/transactions/${acc._id}?limit=50`);
          setBalance(txRes.data.derivedBalance || 0);
          setTransactions(txRes.data.transactions || []);
        }
      } catch (subErr) {
        console.warn('Failed to load accounts/transactions:', subErr.message);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        console.error('Fetch user data error:', err);
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, accountName: name };
      
      const res = await api.post(endpoint, payload);
      localStorage.setItem('nexus_token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      const errorMsg = err.response?.data?.message || (err.message === 'Network Error' ? 'Cannot reach server at http://localhost:3000. Is the backend running?' : err.message) || 'Authentication failed';
      alert(errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!accountId) {
      alert('Your account is still loading or could not be found. Please refresh the page.');
      return;
    }
    if (txType === 'TRANSFER' && !toAccount.trim()) {
      alert('Please specify the recipient Account ID or Email address.');
      return;
    }
    try {
      const payload = {
        type: txType,
        amount: parseFloat(txAmount),
        accountId: accountId,
        description: txDesc || `${txType} transaction`
      };
      if (txType === 'TRANSFER') {
        payload.toAccountId = toAccount.trim();
      }

      const res = await api.post('/transactions', payload);
      
      const completeRes = await api.post(`/transactions/${res.data.transaction._id}/complete`);
      
      const completedAmount = parseFloat(txAmount);
      const completedType = txType;
      const completedRecipient = toAccount;

      setTxAmount('');
      setTxDesc('');
      setToAccount('');
      fetchUserData();

      setReceiptNotice({
        type: completedType,
        amount: completedAmount,
        previewUrl: completeRes.data?.emailPreviewUrl,
        recipient: completedType === 'TRANSFER' ? completedRecipient : null
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || (err.message === 'Network Error' ? 'Cannot reach server at http://localhost:3000. Is the backend running?' : err.message) || 'Transaction failed';
      alert(`Transaction Error: ${errorMsg}`);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="card w-full max-w-md bg-base-200/50 backdrop-blur-xl shadow-2xl">
          <div className="card-body items-center text-center">
            <h1 className="text-4xl font-bold mb-6">NEXUS LEDGER</h1>
            
            <div className="tabs tabs-boxed mb-6">
              <a className={`tab ${isLogin ? 'tab-active' : ''}`} onClick={() => setIsLogin(true)}>Sign In</a>
              <a className={`tab ${!isLogin ? 'tab-active' : ''}`} onClick={() => setIsLogin(false)}>Create Account</a>
            </div>

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
              {!isLogin && (
                <input type="text" placeholder="Account Name" required className="input input-bordered" value={name} onChange={e => setName(e.target.value)} />
              )}
              <input type="email" placeholder="Email" required className="input input-bordered" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" required className="input input-bordered" value={password} onChange={e => setPassword(e.target.value)} />
              <button className="btn btn-primary w-full">{isLogin ? 'Access Ledger' : 'Initialize Account'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="navbar bg-base-200/80 px-8">
        <div className="flex-1"><a className="text-xl font-bold">NEXUS LEDGER</a></div>
        <div className="flex-none gap-4">
          <span className="text-sm">{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm text-error">Disconnect</button>
        </div>
      </div>

      <main className="container mx-auto p-8 max-w-6xl">
        {receiptNotice && (
          <div className="alert bg-base-200 border border-primary/40 shadow-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📨</span>
              <div>
                <div className="font-bold text-sm text-primary">Transaction Receipt Dispatched!</div>
                <div className="text-xs text-base-content/80 mt-0.5">
                  An official tabular receipt with a generated PDF has been created for your <strong>{receiptNotice.type}</strong> of <strong>${receiptNotice.amount.toFixed(2)}</strong>
                  {receiptNotice.recipient ? ` to ${receiptNotice.recipient}` : ''}.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {receiptNotice.previewUrl && (
                <a
                  href={receiptNotice.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm shadow-md shadow-primary/30"
                >
                  View Sent Email & PDF ↗
                </a>
              )}
              <button onClick={() => setReceiptNotice(null)} className="btn btn-ghost btn-sm btn-circle" title="Close">✕</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="stats shadow-2xl bg-base-200 w-full">
            <div className="stat">
              <div className="stat-title">Total Liquidity</div>
              <div className="stat-value text-primary">${balance.toFixed(2)}</div>
              <div className="stat-desc">Account: {accountId}</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl h-fit">
          <div className="card-body">
            <h2 className="card-title">Initiate Protocol</h2>
            <form onSubmit={handleTransaction} className="flex flex-col gap-4">
              <select className="select select-bordered" value={txType} onChange={e => setTxType(e.target.value)}>
                <option value="DEPOSIT">Deposit Funds</option>
                <option value="WITHDRAWAL">Withdraw Funds</option>
                <option value="TRANSFER">Send / Transfer Money</option>
              </select>
              {txType === 'TRANSFER' && (
                <div className="form-control">
                  <input
                    type="text"
                    required
                    className="input input-bordered focus:border-primary text-sm"
                    placeholder="Recipient Account ID or Email"
                    value={toAccount}
                    onChange={e => setToAccount(e.target.value)}
                  />
                  <label className="label py-1">
                    <span className="label-text-alt text-base-content/60">Enter recipient's Account ID or registered email</span>
                  </label>
                </div>
              )}
              <input type="number" step="0.01" min="0.01" required className="input input-bordered" placeholder="Amount (USD)" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
              <input type="text" className="input input-bordered" placeholder="Memo / Description (optional)" value={txDesc} onChange={e => setTxDesc(e.target.value)} />
              <button className="btn btn-primary">{txType === 'TRANSFER' ? 'Send Money' : 'Execute'}</button>
            </form>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title mb-4">Ledger History</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Type & Memo</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-base-content/50">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover">
                        <td>
                          <div className="font-semibold">{tx.type}</div>
                          <div className="text-xs text-base-content/60">{tx.description || 'No description'}</div>
                        </td>
                        <td className="text-xs text-base-content/70">
                          {tx.date ? new Date(tx.date).toLocaleDateString() : 'Today'}
                        </td>
                        <td>
                          <span className="badge badge-sm badge-success badge-outline">
                            {tx.status}
                          </span>
                        </td>
                        <td className={`text-right font-mono font-bold ${tx.type === 'WITHDRAWAL' ? 'text-error' : 'text-success'}`}>
                          {tx.type === 'WITHDRAWAL' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default App;
