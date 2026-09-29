import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Auth from "./Components/Auth";
import AddExpense from "./Components/AddExpense";
import Budget from "./Components/Budget";
import ScanQR from "./Components/ScanQR";
import Transactions from "./Components/Transactions";

import {
  Home,
  QrCode,
  Receipt,
  Wallet,
  ChartPie,
  Settings,
  ArrowRight,
  Utensils,
  ShoppingBag,
  Car,
  HeartPulse,
  Trash2,
} from "lucide-react";

import "./App.css";

function SpendingChart({ data }) {
  if (data.length === 0) {
    return <div className="empty-state">No spending history yet.</div>;
  }

  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  const chartWidth = 700;
  const chartHeight = 280;
  const padding = 40;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : padding + (index * (chartWidth - padding * 2)) / (data.length - 1);

    const y =
      chartHeight -
      padding -
      (item.amount / maxAmount) * (chartHeight - padding * 2);

    return {
      ...item,
      x,
      y,
    };
  });

  const path = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  return (
    <div className="spending-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height="300"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((level) => {
          const y = chartHeight - padding - level * (chartHeight - padding * 2);

          const value = Math.round(maxAmount * level);

          return (
            <g key={level}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />

              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#64748B"
              >
                ₹{value.toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}

        <path
          d={path}
          fill="none"
          stroke="#2563EB"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="6" fill="#2563EB" />

            <text
              x={point.x}
              y={point.y - 14}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="#0F172A"
            >
              ₹{point.amount.toLocaleString("en-IN")}
            </text>

            <text
              x={point.x}
              y={chartHeight - 12}
              textAnchor="middle"
              fontSize="13"
              fill="#64748B"
            >
              {point.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CategoryChart({ data }) {
  if (data.length === 0) {
    return <div className="empty-state">No category spending data yet.</div>;
  }

  const maxAmount = Math.max(
    ...data.map((item) => Math.max(item.spent, item.budget)),
    1,
  );

  const chartWidth = 700;
  const barHeight = 36;
  const gap = 28;
  const leftPadding = 120;
  const rightPadding = 40;

  const chartHeight = data.length * (barHeight + gap) + 20;

  return (
    <div className="category-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={Math.max(chartHeight, 220)}
      >
        {data.map((item, index) => {
          const y = index * (barHeight + gap) + 10;

          const budgetWidth =
            (item.budget / maxAmount) *
            (chartWidth - leftPadding - rightPadding);

          const spentWidth =
            (item.spent / maxAmount) *
            (chartWidth - leftPadding - rightPadding);

          return (
            <g key={item.category}>
              <text
                x="0"
                y={y + 23}
                fontSize="13"
                fontWeight="600"
                fill="#0F172A"
              >
                {item.category}
              </text>

              <rect
                x={leftPadding}
                y={y}
                width={budgetWidth}
                height={barHeight}
                rx="6"
                fill="#E2E8F0"
              />

              <rect
                x={leftPadding}
                y={y}
                width={spentWidth}
                height={barHeight}
                rx="6"
                fill="#2563EB"
              />

              <text
                x={leftPadding + spentWidth + 8}
                y={y + 23}
                fontSize="12"
                fontWeight="600"
                fill="#0F172A"
              >
                ₹{item.spent.toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserName(
        currentUser?.displayName || currentUser?.email?.split("@")[0] || "",
      );
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setExpenses([]);
    setBudgets({
      monthly: 0,
      Food: 0,
      Shopping: 0,
      Transport: 0,
      Health: 0,
      Education: 0,
      Other: 0,
    });
    setCurrentPage("home");
  };
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  

  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("kharchiq-current-page") || "home";
  });
  useEffect(() => {
    localStorage.setItem("kharchiq-current-page", currentPage);
  }, [currentPage]);

  const [expenses, setExpenses] = useState([]);

  const handleAddExpense = (expense) => {
    if (expense.amount > remainingBudget) {
      const extraAmount = expense.amount - remainingBudget;

      const confirmExpense = window.confirm(
        `This expense will exceed your remaining budget by ₹${extraAmount.toLocaleString(
          "en-IN",
        )}.\n\nDo you want to continue?`,
      );

      if (!confirmExpense) {
        return;
      }
    }

    const expenseWithDate = {
      ...expense,
      date: new Date().toISOString(),
    };

    setExpenses((previousExpenses) => [expenseWithDate, ...previousExpenses]);
  };
  const handleDeleteExpense = (expenseId) => {
    setExpenses((previousExpenses) =>
      previousExpenses.filter((expense) => expense.id !== expenseId),
    );
  };
  const [budgets, setBudgets] = useState({
    monthly: 0,
    Food: 0,
    Shopping: 0,
    Transport: 0,
    Health: 0,
    Education: 0,
    Other: 0,
  });
  const totalSpent = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
    const handleSaveBudget = (newBudgets) => {
    setBudgets(newBudgets);
  };

    const [dataLoading, setDataLoading] = useState(true);
  const loadedUserRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets({
        monthly: 0,
        Food: 0,
        Shopping: 0,
        Transport: 0,
        Health: 0,
        Education: 0,
        Other: 0,
      });
      loadedUserRef.current = null;
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    loadedUserRef.current = null;

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          setExpenses(data.expenses || []);
          setBudgets(
            data.budgets || {
              monthly: 0,
              Food: 0,
              Shopping: 0,
              Transport: 0,
              Health: 0,
              Education: 0,
              Other: 0,
            },
          );
        } else {
          setExpenses([]);
          setBudgets({
            monthly: 0,
            Food: 0,
            Shopping: 0,
            Transport: 0,
            Health: 0,
            Education: 0,
            Other: 0,
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }

      loadedUserRef.current = user.uid;
      setDataLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || dataLoading) return;
    if (loadedUserRef.current !== user.uid) return;

    setDoc(doc(db, "users", user.uid), { expenses, budgets }).catch((error) =>
      console.error("Failed to save data:", error),
    );
  }, [expenses, budgets, user, dataLoading]);

  const monthlyBudget = budgets.monthly;
  

  const remainingBudget = monthlyBudget - totalSpent;

  const budgetPercentage =
    monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;
  const budgetProgressWidth = Math.min(budgetPercentage, 100);
  const categoryBudgets = {
    Food: budgets.Food,
    Shopping: budgets.Shopping,
    Transport: budgets.Transport,
    Health: budgets.Health,
    Education: budgets.Education,
    Other: budgets.Other,
  };
  const getMonthKey = (date) => {
    const expenseDate = new Date(date);

    return `${expenseDate.getFullYear()}-${String(
      expenseDate.getMonth() + 1,
    ).padStart(2, "0")}`;
  };
  const monthlyHistory = expenses.reduce((history, expense) => {
    const monthKey = getMonthKey(expense.date);

    if (!history[monthKey]) {
      history[monthKey] = 0;
    }

    history[monthKey] += expense.amount;

    return history;
  }, {});
  const monthlyChartData = Object.entries(monthlyHistory)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => {
      const [year, monthNumber] = month.split("-");

      const monthName = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1,
      ).toLocaleString("en-IN", {
        month: "short",
      });

      return {
        month: `${monthName} ${year}`,
        amount,
      };
    });

  const getCategorySpent = (category) => {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryPercentage = (category) => {
    const spent = getCategorySpent(category);
    const budget = categoryBudgets[category];

    if (budget <= 0) {
      return 0;
    }

    return Math.min(Math.round((spent / budget) * 100), 100);
  };
  if (authLoading) return null;
  if (!user) return <Auth onNameSaved={setUserName} />;
  if (dataLoading) return null;
  const categoryChartData = Object.keys(categoryBudgets)
    .map((category) => ({
      category,
      spent: getCategorySpent(category),
      budget: categoryBudgets[category],
    }))
    .filter((item) => item.budget > 0 || item.spent > 0);
  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <h2>Kharchiq</h2>
            <span>Spend Smart. Live Better.</span>
          </div>
        </div>

        <nav className="navigation">
          <div
            className={`nav-item ${currentPage === "home" ? "active" : ""}`}
            onClick={() => setCurrentPage("home")}
          >
            <Home size={19} />
            <span>Home</span>
          </div>

          <div
            className={`nav-item ${currentPage === "scan" ? "active" : ""}`}
            onClick={() => setCurrentPage("scan")}
          >
            <QrCode size={19} />
            <span>Scan & Pay</span>
          </div>

          <div
            className={`nav-item ${
              currentPage === "transactions" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("transactions")}
          >
            <Receipt size={19} />
            <span>Transactions</span>
          </div>

          <div
            className={`nav-item ${currentPage === "budget" ? "active" : ""}`}
            onClick={() => setCurrentPage("budget")}
          >
            <Wallet size={19} />
            <span>Budget</span>
          </div>

          <div className="nav-divider"></div>

          <div
            className={`nav-item ${currentPage === "insights" ? "active" : ""}`}
            onClick={() => setCurrentPage("insights")}
          >
            <ChartPie size={19} />
            <span>Insights</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-circle">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{userName}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {currentPage === "home" && (
          <>
            {/* HEADER */}
            <header className="header">
              <div>
                <h1>Good Morning, {userName} 👋</h1>
                <p>Here's your spending summary for this month.</p>
              </div>

              <div className="header-actions">
                <button
                  className="add-expense-btn"
                  onClick={() => setShowAddExpense(true)}
                >
                  + Add Expense
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>

                <div className="date">September 2026</div>
              </div>
            </header>

            {/* TOP CARDS */}
            <section className="top-grid">
              {/* BUDGET CARD */}
              <div className="budget-card">
                <div className="card-label">
                  <span>Monthly Budget</span>
                  <Wallet size={19} />
                </div>

                {monthlyBudget === 0 ? (
                  <div className="budget-empty">
                    <h2>Set Your Budget</h2>

                    <p>
                      Set your monthly budget to start tracking your spending.
                    </p>

                    <button
                      className="set-budget-btn"
                      onClick={() => setCurrentPage("budget")}
                    >
                      Set Budget
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2>₹{monthlyBudget.toLocaleString("en-IN")}</h2>

                    <div className="budget-details">
                      <span>₹{totalSpent.toLocaleString("en-IN")} spent</span>
                      <span>{budgetPercentage}% used</span>
                    </div>

                    <div className="progress">
                      <div
                        className={`progress-fill ${
                          budgetPercentage >= 100
                            ? "budget-progress-danger"
                            : ""
                        }`}
                        style={{ width: `${budgetProgressWidth}%` }}
                      ></div>
                    </div>

                    <div className="remaining">
                      <span>Remaining</span>
                      <strong>
                        ₹{remainingBudget.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {/* SCAN CARD */}
              <div className="scan-card">
                <div className="scan-icon">
                  <QrCode size={27} />
                </div>

                <div className="scan-content">
                  <h2>Scan & Pay</h2>

                  <p>Scan any UPI QR code and track your expense instantly.</p>

                  <button onClick={() => setCurrentPage("scan")}>
                    Scan QR Code
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </section>

            {/* CATEGORY SECTION */}
            <section className="section">
              <div className="section-header">
                <div>
                  <h2>Category Budgets</h2>
                  <p>Track where your money is going.</p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setCurrentPage("budget")}
                >
                  View Budget
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="category-grid">
                <Category
                  icon={<Utensils size={20} />}
                  name="Food"
                  spent={`₹${getCategorySpent("Food").toLocaleString("en-IN")}`}
                  budget={`₹${categoryBudgets.Food.toLocaleString("en-IN")}`}
                  percent={`${getCategoryPercentage("Food")}%`}
                  warning={getCategoryPercentage("Food") >= 80}
                />
                <Category
                  icon={<ShoppingBag size={20} />}
                  name="Shopping"
                  spent={`₹${getCategorySpent("Shopping").toLocaleString("en-IN")}`}
                  budget={`₹${categoryBudgets.Shopping.toLocaleString("en-IN")}`}
                  percent={`${getCategoryPercentage("Shopping")}%`}
                  warning={getCategoryPercentage("Shopping") >= 80}
                />

                <Category
                  icon={<Car size={20} />}
                  name="Transport"
                  spent={`₹${getCategorySpent("Transport").toLocaleString("en-IN")}`}
                  budget={`₹${categoryBudgets.Transport.toLocaleString("en-IN")}`}
                  percent={`${getCategoryPercentage("Transport")}%`}
                  warning={getCategoryPercentage("Transport") >= 80}
                />

                <Category
                  icon={<HeartPulse size={20} />}
                  name="Health"
                  spent={`₹${getCategorySpent("Health").toLocaleString("en-IN")}`}
                  budget={`₹${categoryBudgets.Health.toLocaleString("en-IN")}`}
                  percent={`${getCategoryPercentage("Health")}%`}
                  warning={getCategoryPercentage("Health") >= 80}
                />
              </div>
            </section>

            {/* RECENT TRANSACTIONS */}
            <section className="section">
              <div className="section-header">
                <div>
                  <h2>Recent Transactions</h2>
                  <p>Your latest expenses.</p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setCurrentPage("transactions")}
                >
                  View All
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="transactions">
                {expenses.slice(0, 5).map((expense) => {
                  let icon;

                  if (expense.category === "Food") {
                    icon = <Utensils size={19} />;
                  } else if (expense.category === "Shopping") {
                    icon = <ShoppingBag size={19} />;
                  } else if (expense.category === "Transport") {
                    icon = <Car size={19} />;
                  } else if (expense.category === "Health") {
                    icon = <HeartPulse size={19} />;
                  } else {
                    icon = <Wallet size={19} />;
                  }

                  return (
                    <Transaction
                      key={expense.id}
                      icon={icon}
                      name={expense.note}
                      category={expense.category}
                      amount={`₹${expense.amount.toLocaleString("en-IN")}`}
                      onDelete={() => handleDeleteExpense(expense.id)}
                    />
                  );
                })}
              </div>
            </section>

            {/* ALERT */}
            {monthlyBudget > 0 && (
              <>
                {totalSpent > monthlyBudget && (
                  <div className="alert">
                    <div className="alert-icon">!</div>
                    <div>
                      <strong>Monthly budget exceeded</strong>
                      <p>
                        You've exceeded your monthly budget by ₹
                        {(totalSpent - monthlyBudget).toLocaleString("en-IN")}.
                      </p>
                    </div>
                  </div>
                )}

                {Object.keys(categoryBudgets).map((category) => {
                  const budget = categoryBudgets[category];
                  const spent = getCategorySpent(category);

                  if (budget <= 0) {
                    return null;
                  }

                  if (spent > budget) {
                    return (
                      <div className="alert" key={category}>
                        <div className="alert-icon">!</div>
                        <div>
                          <strong>{category} budget exceeded</strong>
                          <p>
                            You've exceeded your {category} budget by ₹
                            {(spent - budget).toLocaleString("en-IN")}.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (Math.round((spent / budget) * 100) >= 80) {
                    return (
                      <div className="alert" key={category}>
                        <div className="alert-icon">!</div>
                        <div>
                          <strong>{category} budget is almost full</strong>
                          <p>
                            You've used {Math.round((spent / budget) * 100)}% of
                            your {category} budget this month.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </>
            )}
          </>
        )}

        {/* --- MOVED OUT of the "home" block so these pages actually render --- */}

        {currentPage === "transactions" && (
          <section className="page-content">
            <div className="section-header">
              <div>
                <h2>Transactions</h2>
                <p>View and manage all your expenses.</p>
              </div>

              <button
                className="add-expense-btn"
                onClick={() => setShowAddExpense(true)}
              >
                + Add Expense
              </button>
            </div>

            <div className="transactions-page-list">
              {expenses.length === 0 ? (
                <div className="empty-state">
                  <Receipt size={40} />
                  <h3>No transactions yet</h3>
                  <p>Add your first expense to see it here.</p>
                </div>
              ) : (
                expenses.map((expense) => {
                  let icon;

                  if (expense.category === "Food") {
                    icon = <Utensils size={20} />;
                  } else if (expense.category === "Shopping") {
                    icon = <ShoppingBag size={20} />;
                  } else if (expense.category === "Transport") {
                    icon = <Car size={20} />;
                  } else if (expense.category === "Health") {
                    icon = <HeartPulse size={20} />;
                  } else {
                    icon = <Wallet size={20} />;
                  }

                  return (
                    <Transaction
                      key={expense.id}
                      icon={icon}
                      name={expense.note}
                      category={expense.category}
                      amount={`₹${expense.amount.toLocaleString("en-IN")}`}
                      onDelete={() => handleDeleteExpense(expense.id)}
                    />
                  );
                })
              )}
            </div>
          </section>
        )}

        {currentPage === "budget" && (
          <Budget budgets={budgets} onSave={handleSaveBudget} />
        )}

        {currentPage === "scan" && (
          <section className="scan-page">
            <div className="page-header">
              <div>
                <h1>Scan & Pay</h1>
                <p>Scan a UPI QR code to make a payment.</p>
              </div>
            </div>

            <div className="scanner-card">
              <div className="scanner-icon">
                <QrCode size={70} />
              </div>

              <h2>Scan UPI QR Code</h2>

              <p>Scan any UPI QR code and track your expense instantly.</p>

              <button
                className="scan-button"
                onClick={() => setShowScanner(true)}
              >
                <QrCode size={20} />
                Scan QR Code
              </button>

              <p className="scanner-note">
                Your payment will be completed securely through your UPI app.
              </p>
            </div>
          </section>
        )}

        {showScanner && (
          <ScanQR
            onClose={() => setShowScanner(false)}
            onExpenseAdded={handleAddExpense}
          />
        )}

        {currentPage === "insights" && (
          <section className="insights-page">
            <div className="page-header">
              <div>
                <h1>Insights</h1>
                <p>
                  Understand your spending habits and manage your money better.
                </p>
              </div>
            </div>

            <div className="insights-summary">
              <div className="insight-card">
                <span>Total Spent</span>
                <h2>₹{totalSpent}</h2>
                <p>This month</p>
              </div>

              <div className="insight-card">
                <span>Remaining Budget</span>
                <h2>₹{remainingBudget}</h2>
                <p>Available to spend</p>
              </div>

              <div className="insight-card">
                <span>Budget Used</span>
                <h2>{budgetPercentage}%</h2>
                <p>Of monthly budget</p>
              </div>

              <div className="insight-card">
                <span>Transactions</span>
                <h2>{expenses.length}</h2>
                <p>This month</p>
              </div>
            </div>
            <div className="spending-chart-card">
              <div className="category-insights-header">
                <div>
                  <h2>Monthly Spending History</h2>
                  <p>Track your spending month by month.</p>
                </div>
              </div>

              <SpendingChart data={monthlyChartData} />
              <div className="category-chart-card">
                <div className="category-insights-header">
                  <div>
                    <h2>Category Budget Overview</h2>
                    <p>Compare your spending with category budgets.</p>
                  </div>
                </div>

                <CategoryChart data={categoryChartData} />
              </div>
            </div>
            <div className="category-insights">
              <div className="category-insights-header">
                <div>
                  <h2>Category Spending</h2>
                  <p>See where your money is going this month.</p>
                </div>
              </div>

              <div className="category-insights-list">
                {Object.keys(budgets)
                  .filter((category) => category !== "monthly")
                  .map((category) => {
                    const spent = getCategorySpent(category);
                    const budget = budgets[category];
                    const percentage =
                      budget > 0
                        ? Math.min(Math.round((spent / budget) * 100), 100)
                        : 0;

                    return (
                      <div className="category-insight-item" key={category}>
                        <div className="category-insight-top">
                          <span>{category}</span>

                          <span>
                            ₹{spent} / ₹{budget}
                          </span>
                        </div>

                        <div className="category-progress">
                          <div
                            className="category-progress-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="category-insight-bottom">
                          <span>{percentage}% used</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </main>

      {showAddExpense && (
        <AddExpense
          onClose={() => setShowAddExpense(false)}
          onAdd={handleAddExpense}
        />
      )}
    </div>
  );
}
/* CATEGORY COMPONENT */
function Category({ icon, name, spent, budget, percent, warning }) {
  return (
    <div className="category-card">
      <div className="category-top">
        <div className="category-icon">{icon}</div>

        <span className={warning ? "warning" : ""}>{percent}</span>
      </div>

      <h3>{name}</h3>

      <p>
        {spent} <span>/ {budget}</span>
      </p>

      <div className="category-progress">
        <div
          className={warning ? "warning-fill" : ""}
          style={{ width: percent }}
        ></div>
      </div>
    </div>
  );
}
/* TRANSACTION COMPONENT */
function Transaction({ icon, name, category, amount, onDelete }) {
  return (
    <div className="transaction">
      <div className="transaction-left">
        <div className="transaction-icon">{icon}</div>

        <div>
          <strong>{name}</strong>
          <span>{category}</span>
        </div>
      </div>

      <div className="transaction-right">
        <strong className="amount">-{amount}</strong>

        <button
          className="delete-transaction-btn"
          onClick={onDelete}
          title="Delete transaction"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
export default App;
