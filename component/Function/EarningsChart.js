import React from "react";
import Chart from "react-apexcharts";

const EarningsChart = ({ earningsData, earningsViewMode }) => {
  const chartOptions = {
    series: [
      {
        name: "Earnings (₹)",
        data: earningsData[earningsViewMode]?.data || [],
      },
    ],
    chart: {
      height: 300,
      type: "line",
      zoom: { enabled: false },
      dropShadow: { enabled: true, color: "#000", top: 18, left: 7, blur: 16, opacity: 0.2 },
      toolbar: { show: false },
    },
    colors: ["#28a745"],
    stroke: { width: [3], curve: "smooth" },
    xaxis: {
      categories: earningsData[earningsViewMode]?.categories || [],
    },
    legend: { position: "top", horizontalAlign: "right" },
  };

  return <Chart options={chartOptions} series={chartOptions.series} type="line" height={300} />;
};

export default EarningsChart;
