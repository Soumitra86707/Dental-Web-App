import React from "react";
import Chart from "react-apexcharts";

const PatientsChart = ({ patientsData, patientsViewMode }) => {
  const chartOptions = {
    series: [
      {
        name: "Patients Count",
        data: patientsData[patientsViewMode]?.data || [],
      },
    ],
    chart: {
      height: 300,
      type: "line",
      zoom: { enabled: false },
      dropShadow: { enabled: true, color: "#000", top: 18, left: 7, blur: 16, opacity: 0.2 },
      toolbar: { show: false },
    },
    colors: ["#007bff"],
    stroke: { width: [3], curve: "smooth" },
    xaxis: {
      categories: patientsData[patientsViewMode]?.categories || [],
    },
    legend: { position: "top", horizontalAlign: "right" },
  };

  return <Chart options={chartOptions} series={chartOptions.series} type="line" height={300} />;
};

export default PatientsChart;
