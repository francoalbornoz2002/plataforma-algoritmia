// src/services/courses.service.ts

import apiClient from "../lib/axios";
import type { FindCoursesParams, PaginatedCoursesResponse } from "../types";

/**
 * Fetches a paginated list of courses from the API,
 * optionally applying filters.
 * @param params - Filtering, pagination, and sorting parameters.
 * @returns A promise resolving to the paginated course data.
 */
export const findCourses = async (
  params: FindCoursesParams
): Promise<PaginatedCoursesResponse> => {
  try {
    // Makes a GET request to /api/courses/all (or your configured base URL + /cursos)
    // Axios automatically converts the 'params' object into query parameters
    const response = await apiClient.get("/courses/all", {
      params: params,
      // Ensure Axios handles array params correctly if you add them later
      paramsSerializer: {
        indexes: null,
      },
    });
    // Returns the data part of the Axios response, which should match PaginatedCoursesResponse
    return response.data;
  } catch (err: any) {
    // Rethrow the error so the component's catch block can handle it
    console.error("Error fetching courses:", err.response?.data || err.message);
    throw err.response?.data || new Error("Error al buscar los cursos.");
  }
};

// ... (Your other course service functions like createCourse, updateCourse, deleteCourse will go here)
