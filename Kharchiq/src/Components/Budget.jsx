import { useState } from "react";
import {
  Wallet,
  Utensils,
  ShoppingBag,
  Car,
  HeartPulse,
  BookOpen,
  MoreHorizontal,
  Save,
} from "lucide-react";

function Budget({ budgets, onSave }) {
  const [monthlyBudget, setMonthlyBudget] = useState(
    budgets.monthly === 0 ? "" : budgets.monthly,
  );

  const [categories, setCategories] = useState({
    Food: budgets.Food === 0 ? "" : budgets.Food,
    Shopping: budgets.Shopping === 0 ? "" : budgets.Shopping,
    Transport: budgets.Transport === 0 ? "" : budgets.Transport,
    Health: budgets.Health === 0 ? "" : budgets.Health,
    Education: budgets.Education === 0 ? "" : budgets.Education,
    Other: budgets.Other === 0 ? "" : budgets.Other,
  });

  const handleCategoryChange = (category, value) => {
    setCategories({
      ...categories,
      [category]: value === "" ? "" : Number(value),
    });
  };

  const handleSave = () => {
    if (!monthlyBudget || Number(monthlyBudget) <= 0) {
      alert("Please enter your monthly budget.");
      return;
    }

    onSave({
      monthly: Number(monthlyBudget),
      Food: Number(categories.Food) || 0,
      Shopping: Number(categories.Shopping) || 0,
      Transport: Number(categories.Transport) || 0,
      Health: Number(categories.Health) || 0,
      Education: Number(categories.Education) || 0,
      Other: Number(categories.Other) || 0,
    });

    alert("Budget saved successfully!");
  };

  const categoryIcons = {
    Food: <Utensils size={20} />,
    Shopping: <ShoppingBag size={20} />,
    Transport: <Car size={20} />,
    Health: <HeartPulse size={20} />,
    Education: <BookOpen size={20} />,
    Other: <MoreHorizontal size={20} />,
  };

  return (
    <div className="budget-page">
      <div className="budget-page-header">
        <div>
          <h1>Budget</h1>
          <p>Set and manage your monthly spending limits.</p>
        </div>

        <button className="save-budget-btn" onClick={handleSave}>
          <Save size={18} />
          Save Budget
        </button>
      </div>

      <div className="budget-main-card">
        <div className="budget-card-title">
          <Wallet size={22} />
          <div>
            <h2>Monthly Budget</h2>
            <p>How much do you want to spend this month?</p>
          </div>
        </div>

        <div className="budget-input-wrapper">
          <span>₹</span>

          <input
            type="number"
            value={monthlyBudget}
            onChange={(e) =>
              setMonthlyBudget(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
          />
        </div>
      </div>

      <div className="category-budget-section">
        <div className="section-heading">
          <h2>Category Budgets</h2>
          <p>Set spending limits for each category.</p>
        </div>

        <div className="budget-category-grid">
          {Object.keys(categories).map((category) => (
            <div className="budget-category-card" key={category}>
              <div className="category-icon">{categoryIcons[category]}</div>

              <div className="category-info">
                <label>{category}</label>

                <div className="category-input">
                  <span>₹</span>

                  <input
                    type="number"
                    value={categories[category]}
                    onChange={(e) =>
                      handleCategoryChange(category, e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Budget;
