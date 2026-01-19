import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 10;

const OnlineUsersModal = ({ showModal, setShowModal }) => {
  const [loading, setLoading] = useState(false);
  const [usersData, setUsersData] = useState({ count: 0, users: [] });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!showModal) return;

    const fetchOnlineUsers = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth/online/users`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setUsersData(res.data);
        setCurrentPage(1); // reset page when modal opens
      } catch (error) {
        toast.error("Failed to fetch online users");
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
  }, [showModal]);

  if (!showModal) return null;

  // Pagination calculations
  const totalPages = Math.ceil(usersData.users.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = usersData.users.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/auth/user-logs/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob", // IMPORTANT for file download
        }
      );

      // Create blob URL
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      // Create temp link
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user-logs.csv");
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download CSV");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-md">
      <div className="relative m-5 w-11/12 max-w-4xl rounded-lg border border-gray-900 bg-white p-6 shadow-lg dark:bg-navy-700">
        {/* Close Button */}
        <button
          className="absolute right-0 top-0 pl-2 pr-1 text-3xl font-bold text-gray-600 hover:text-gray-900 dark:hover:text-gray-100"
          onClick={() => setShowModal(false)}
        >
          &times;
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Online Users ({usersData.count})
          </h2>

          <button
            onClick={handleDownloadCSV}
            disabled={loading}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center font-semibold text-gray-700 dark:text-gray-200">
            Loading...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-navy-800">
                  <tr>
                    <th className="border px-3 py-2 text-left text-gray-700 dark:text-gray-200">
                      Name
                    </th>
                    <th className="border px-3 py-2 text-left text-gray-700 dark:text-gray-200">
                      Email
                    </th>
                    <th className="border px-3 py-2 text-left text-gray-700 dark:text-gray-200">
                      Role
                    </th>
                    <th className="border px-3 py-2 text-left text-gray-700 dark:text-gray-200">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-navy-600"
                    >
                      <td className="border px-3 py-2 text-gray-800 dark:text-gray-100">
                        {user.name}
                      </td>
                      <td className="border px-3 py-2 text-gray-800 dark:text-gray-100">
                        {user.email}
                      </td>
                      <td className="border px-3 py-2 capitalize text-gray-800 dark:text-gray-100">
                        {user.role}
                      </td>
                      <td className="border px-3 py-2">
                        {user.status === 1 ? (
                          <span className="rounded bg-green-100 px-2 py-1 text-green-700 dark:bg-green-800 dark:text-green-200">
                            Online
                          </span>
                        ) : (
                          <span className="rounded bg-red-100 px-2 py-1 text-red-700 dark:bg-red-800 dark:text-red-200">
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usersData.users.length === 0 && (
                <div className="mt-4 text-center text-gray-500 dark:text-gray-300">
                  No online users found
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnlineUsersModal;
