import React from "react";
import {
  Utensils,
  ShoppingBag,
  Car,
  HeartPulse,
  Wallet,
  Search,
  ArrowDownLeft,
  Trash2,
} from "lucide-react";

function Transactions({ expenses, onDelete }) {
  const getIcon = (category) => {
    if (category === "Food") {
      return <Utensils size={20} />;
    }

    if (category === "Shopping") {
      return <ShoppingBag size={20} />;
    }

    if (category === "Transport") {
      return <Car size={20} />;
    }

    if (category === "Health") {
      return <HeartPulse size={20} />;
    }

    return <Wallet size={20} />;
  };

  return (
    <div className="transactions-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>View and manage all your expenses.</p>
        </div>

        <button className="add-expense-btn">+ Add Expense</button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="transaction-tools">
        <div className="search-box">
          <Search size={19} />
          <input type="text" placeholder="Search transactions..." />
        </div>

        <select className="filter-select">
          <option>All Categories</option>
          <option>Food</option>
          <option>Shopping</option>
          <option>Transport</option>
          <option>Health</option>
          <option>Other</option>
        </select>
      </div>

      {/* SUMMARY */}
      <div className="transaction-summary">
        <div className="summary-card">
          <span>Total Transactions</span>
          <strong>{expenses.length}</strong>
        </div>

        <div className="summary-card">
          <span>Total Spent</span>
          <strong>
            ₹
            {expenses
              .reduce((total, expense) => total + expense.amount, 0)
              .toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-card">
          <span>This Month</span>
          <strong>September 2026</strong>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <section className="transaction-section">
        <div className="transaction-section-header">
          <div>
            <h2>All Transactions</h2>
            <p>Your complete spending history.</p>
          </div>
        </div>

        <div className="transaction-list">
          {expenses.length === 0 ? (
            <div className="empty-transactions">
              <Wallet size={35} />
              <h3>No transactions yet</h3>
              <p>Your expenses will appear here.</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div className="transaction-row" key={expense.id}>
                <div className="transaction-info">
                  <div className="transaction-icon">
                    {getIcon(expense.category)}
                  </div>

                  <div>
                    <strong>{expense.note}</strong>

                    <span>
                      {expense.category} • {expense.date}
                    </span>
                  </div>
                </div>

                <div className="transaction-amount">
                  <strong>-₹{expense.amount.toLocaleString("en-IN")}</strong>

                  <small>
                    <ArrowDownLeft size={13} />
                    Expense
                  </small>

                  <button
                    className="delete-transaction-btn"
                    onClick={() => onDelete(expense.id)}
                    title="Delete transaction"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Transactions;
