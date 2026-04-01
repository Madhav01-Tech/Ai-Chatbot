import React from "react";
import { dummyPlans } from "../assets/assets";
import Loading from "./Loading";
import { useNavigate } from "react-router-dom";

const Credit = () => {
  const [plans, setPlans] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    setTimeout(() => {
      setPlans(dummyPlans);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <Loading />;

  return (
    <div
      className="w-full min-h-screen p-6 pt-16 xl:px-16 2xl:px-24"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >
      {/* Heading */}
      <div className="text-center mb-14">
        <h2
          className="text-4xl font-bold"
          style={{
            color: "var(--primary-color)",
          }}
        >
          Choose Your Plan
        </h2>

        <p className="mt-3 text-base">
          Upgrade your experience with flexible and powerful credit plans.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className="rounded-3xl p-8 shadow-lg transition-all duration-300 hover:-translate-y-2"
            style={{
              backgroundColor: "var(--card-bg)",
              border: `3px solid ${
                plan.popular ? "var(--primary-color)" : "transparent"
              }`,
            }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div
                className="mb-4 inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: "var(--primary-color)",
                  color: "#fff",
                }}
              >
                Most Popular
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-2xl font-semibold mb-4">
              {plan.name}
            </h3>

            {/* Price */}
            <p className="text-3xl font-bold mb-6">
              ${plan.price}
              <span className="text-sm font-normal ml-1">
                / {plan.duration}
              </span>
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span style={{ color: "var(--primary-color)" }}>✔</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300"
              style={{
                backgroundColor: "var(--primary-color)",
                color: "#fff",
              }}
              onClick={(e)=>(e.preventDefault(), navigate("/plans"))}
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credit;
