import React, { useState } from "react";
import Chart from "react-apexcharts";

const EarningChart = ({ chartData, timeRange }) => {
  const [hoveredSeries, setHoveredSeries] = useState(null);

  const categories = chartData.map(([month]) => month);
  const series = [
    { name: "Doctor Paid Amount", data: chartData.map(([_, data]) => data.drPaid) }, // Red
    { name: "Doctor Due Amount", data: chartData.map(([_, data]) => data.drDue) }, // Yellow
    { name: "Patient Paid Amount", data: chartData.map(([_, data]) => data.patientPaid) }, // Green
    { name: "Patient Due Amount", data: chartData.map(([_, data]) => data.patientDue) }, // Blue
  ];

  const chartOptions = {
    chart: {
      id: "earnings-chart",
      toolbar: { show: false },
      events: {
        dataPointMouseEnter: (event, chartContext, { seriesIndex }) => {
          setHoveredSeries(seriesIndex);
        },
        dataPointMouseLeave: () => {
          setHoveredSeries(null);
        },
      },
    },
    xaxis: { categories },
    stroke: { curve: "smooth", width: 2 },
    colors: ["#FF0000", "#FFD700", "#00FF00", "#0000FF"], // Line Colors
    markers: { size: 5, hover: { size: 8 } },
    tooltip: {
      enabled: true,
      shared: false, // Show only the hovered line's tooltip
    },
    legend: { show: true, position: "top", horizontalAlign: "center" },
    fill: {
      opacity: series.map((_, index) => (hoveredSeries === null || hoveredSeries === index ? 1 : 0.1)),
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      show: true,
    },
    theme: {
      mode: "light",
    },
    chart: {
      zoom: { enabled: false }, // Disable zoom (which changes cursor)
      animations: { enabled: true },
      background: "transparent",
      foreColor: "#333",
    },
    tooltip: {
      style: { cursor: "default" }, // Ensures normal cursor
    },
  };

  return (

    <div>
      <h2>{timeRange === "6months" ? "Last 6 Months Earnings" : "Last 1 Year Earnings"}</h2>
      <Chart options={chartOptions} series={series} type="line" height={300} />
    </div>
  );
};

export default EarningChart;
