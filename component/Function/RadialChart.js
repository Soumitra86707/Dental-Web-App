import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { db } from "../Config/FirebaseConfig"; // Firestore instance
import { collection, getDocs } from "firebase/firestore";

const RadialBarChart = () => {
  const [chartData, setChartData] = useState({ labels: [], series: [] });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "prescriptions"));
        const reasonCount = {};

        // Count occurrences of each reason_for_visit
        querySnapshot.forEach((doc) => {
          const reason = doc.data().reason_for_visit;
          if (reason) {
            reasonCount[reason] = (reasonCount[reason] || 0) + 1;
          }
        });

        // Convert to array and sort in descending order
        const sortedReasons = Object.entries(reasonCount)
          .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
          .slice(0, 10); // Get top 10

        // Extract labels and series
        const labels = sortedReasons.map(([reason]) => reason);
        const series = sortedReasons.map(([, count]) => count);

        setChartData({ labels, series });
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };

    fetchChartData();
  }, []);

  const chartOptions = {
    series: chartData.series,
    chart: { height: 500, type: "radialBar" },
    colors: ["#003049", "#d62828", "#f77f00", "#fcbf49", "#e76f51"],
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: "16px" },
          value: { fontSize: "14px" },
          total: {
            show: true,
            label: "Total",
            formatter: function () {
              return chartData.series.reduce((a, b) => a + b, 0); // Dynamic sum
            },
          },
        },
      },
    },
    labels: chartData.labels,
  };

  return (
    <div>
      {chartData.series.length > 0 ? (
        <Chart options={chartOptions} series={chartOptions.series} type="radialBar" height={500} />
      ) : (
        <p>Loading Chart...</p>
      )}
    </div>
  );
};

export default RadialBarChart;
