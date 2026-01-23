import './PaymentsPage.css';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useState, useEffect } from 'react';
import { getTransactions, getDashboardInsights } from '../../../data/modules/tutor-module';
import { FaCoins, FaHistory, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
export function PaymentsPage() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState({
        totalEarning: 0,
        totalWithdrawals: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const limit = 10;
    const fetchInsights = async () => {
        try {
            const data = await getDashboardInsights();
            setInsights({
                totalEarning: data.totalEarning || 0,
                totalWithdrawals: data.totalWithdrawals || 0
            });
        } catch (err) {
            console.error('Failed to fetch insights:', err);
        }
    };
    const fetchTransactions = async (page = 1) => {
        try {
            const data = await getTransactions({ page, limit });
            const txns = data.transactions || [];
            setTransactions(txns);
            setTotalPages(data.pagination?.pages || 1);
            setTotalTransactions(data.pagination?.total || 0);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchInsights();
        fetchTransactions(currentPage);
    }, [currentPage]);
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    const availableBalance = insights.totalEarning - insights.totalWithdrawals;
    if (loading) {
        return (
            <div className="payments-page-root">
                <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
                <main className="payments-main">
                    <div className="topbar">
                        <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>
                            &#9776;
                        </button>
                        <div className="title">Payments</div>
                    </div>
                    <div className="loading-container">
                        <FaHistory className="loading-icon" />
                        <p>Loading...</p>
                    </div>
                </main>
            </div>
        );
    }
    return (
        <div className="payments-page-root">
            <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <main className="payments-main">
                <div className="topbar">
                    <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>
                        &#9776;
                    </button>
                    <div className="title">Payments &amp; Transactions</div>
                </div>
                {error && <div className="error-card">{error}</div>}
                <div className="balance-card">
                    <div className="balance-main">
                        <h1 className="balance-value">{availableBalance.toLocaleString()} INR</h1>
                        <p className="balance-label">Available balance</p>
                    </div>
                    <div className="balance-breakdown">
                        <div className="breakdown-item">
                            <span className="breakdown-label">Total earnings</span>
                            <span className="breakdown-value">{insights.totalEarning.toLocaleString()} INR</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="breakdown-label">Total withdrawn</span>
                            <span className="breakdown-value withdrawn">{insights.totalWithdrawals.toLocaleString()} INR</span>
                        </div>
                    </div>
                </div>
                {transactions.length === 0 ? (
                    <div className="empty-state">
                        <h2>No transactions yet</h2>
                        <p>Your payment history will appear here once you make withdrawals.</p>
                    </div>
                ) : (
                    <div className="transactions-section">
                        <h2>Transaction history</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction, index) => (
                                    <tr key={transaction._id} className={index % 2 === 0 ? 'even-row' : ''}>
                                        <td>{new Date(transaction.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="amount-cell">{(transaction.amount || 0).toLocaleString()} INR</td>
                                        <td className={`status-cell ${transaction.status}`}>
                                            {transaction.status?.toUpperCase()}
                                        </td>
                                        <td>{transaction.type || 'N/A'}</td>
                                        <td className="order-id-cell">{transaction.orderId || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pagination-section">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <FaChevronLeft /> Previous
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next <FaChevronRight />
                            </button>
                        </div>
                        <p className="table-footer">Showing {transactions.length} of {totalTransactions} transactions</p>
                    </div>
                )}
            </main>
        </div>
    );
}

