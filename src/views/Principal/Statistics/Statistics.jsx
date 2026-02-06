import React, { useEffect, useState } from "react";
import axios from "axios";

const Statistics = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/get/principalsideData`
      );
      if (res.data?.status) {
        setTableData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics", error);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Statistics Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of booklet questions and marks
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase text-gray-500">
                  Total Entries
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-800">
                  {tableData.length}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Total Marks
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {tableData.reduce(
                    (sum, item) =>
                      sum + (item.questiondefinitionId?.schemaId?.maxMarks || 0),
                    0
                  )}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div> */}

          {/* <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Avg Marks
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {tableData.length > 0
                    ? (
                        tableData.reduce(
                          (sum, item) =>
                            sum +
                            (item.questiondefinitionId?.schemaId?.maxMarks || 0),
                          0
                        ) / tableData.length
                      ).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
            </div>
          </div> */}
        </div>

        {/* Table Section */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Detailed Statistics
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                <p className="mt-4 text-center text-gray-600">
                  Loading statistics...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-8 text-center">
              <div className="inline-block rounded-lg border border-red-200 bg-red-50 p-6">
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium text-red-700">{error}</p>
                <button
                  onClick={fetchStatistics}
                  className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Table Content */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Booklet Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Question Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Marks
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.length > 0 ? (
                    tableData.map((item, index) => (
                      <tr
                        key={index}
                        className="transition-colors duration-150 hover:bg-indigo-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="mr-3 rounded-lg bg-blue-100 p-2">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <span className="font-medium text-gray-800">
                              {item.answerPdfName}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm text-gray-700">
                            {item.questionName || "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                            <svg
                              className="mr-1 h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path
                                fillRule="evenodd"
                                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {item.allottedMarks || 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-red-400 px-3 py-1 font-mono text-sm text-white">
                            {item.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <svg
                            className="mb-4 h-16 w-16 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-lg font-medium text-gray-500">
                            No data found
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            There are no statistics to display at the moment
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && tableData.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {tableData.length}{" "}
            {tableData.length === 1 ? "entry" : "entries"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
