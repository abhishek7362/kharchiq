import { useState } from "react";
import { X, Plus } from "lucide-react";

function AddExpense({ onClose, onAdd }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const expense = {
      id: Date.now(),
      amount: Number(amount),
      category,
      note: note || "Expense",
      date: new Date().toLocaleDateString("en-IN"),
    };

    onAdd(expense);

    setAmount("");
    setCategory("Food");
    setNote("");

    onClose();
  };

  return (
    <div className="modal-overlay">

      <div className="expense-modal">

        <div className="modal-header">
          <div>
            <h2>Add Expense</h2>
            <p>Record your spending</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>


        <form onSubmit={handleSubmit}>

          <label>Amount</label>

          <div className="amount-input">
            <span>₹</span>

            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>


          <label>Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Shopping</option>
            <option>Transport</option>
            <option>Health</option>
            <option>Education</option>
            <option>Other</option>
          </select>


          <label>Note</label>

          <input
            type="text"
            placeholder="e.g. Sharma Restaurant"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />


          <button className="save-expense" type="submit">
            <Plus size={18} />
            Save Expense
          </button>

        </form>

      </div>

    </div>
  );
}

export default AddExpense;