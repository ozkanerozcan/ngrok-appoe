import { supabase } from "../lib/supabase";

export const taskService = {
  // Get all tasks for the current user with related project data
  async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        projects!tasks_project_fkey (
          id,
          title
        ),
        activities:activity (
          id,
          title
        ),
        modules:module (
          id,
          title
        )
      `
      )
      .eq("created_by", user.id)
      .order("deadline_at", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single task by ID with related data
  async getById(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid task ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        projects!tasks_project_fkey (
          id,
          title
        ),
        activities:activity (
          id,
          title
        ),
        modules:module (
          id,
          title
        )
      `
      )
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Task not found");

    // Get current user info to show proper names
    const { data: currentUser } = await supabase.auth.getUser();

    // Create user profiles with available information
    const createdByProfile = data.created_by
      ? {
          id: data.created_by,
          full_name:
            data.created_by === currentUser?.user?.id
              ? currentUser.user.user_metadata?.full_name ||
                currentUser.user.user_metadata?.name ||
                currentUser.user.email ||
                data.created_by
              : data.created_by, // For other users, just show ID for now
        }
      : null;

    const updatedByProfile = data.updated_by
      ? {
          id: data.updated_by,
          full_name:
            data.updated_by === currentUser?.user?.id
              ? currentUser.user.user_metadata?.full_name ||
                currentUser.user.user_metadata?.name ||
                currentUser.user.email ||
                data.updated_by
              : data.updated_by, // For other users, just show ID for now
        }
      : null;

    return {
      ...data,
      created_by_profile: createdByProfile,
      updated_by_profile: updatedByProfile,
    };
  },

  // Create a new task
  async create(taskData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up taskData to avoid passing "undefined" strings to UUID fields
    const cleanedTaskData = {};
    Object.keys(taskData).forEach((key) => {
      if (
        taskData[key] &&
        taskData[key] !== "undefined" &&
        taskData[key] !== "null"
      ) {
        cleanedTaskData[key] = taskData[key];
      }
    });

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          ...cleanedTaskData,
          status: taskData.status || null,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing task
  async update(id, taskData) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid task ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up taskData to avoid passing "undefined" strings to UUID fields
    const cleanedTaskData = {};
    Object.keys(taskData).forEach((key) => {
      if (
        (taskData[key] !== undefined &&
          taskData[key] !== "undefined" &&
          taskData[key] !== "null") ||
        (key === "status" && taskData[key] === null)
      ) {
        cleanedTaskData[key] = taskData[key];
      }
    });

    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...cleanedTaskData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  // Update task status
  async updateStatus(id, status) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid task ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a task
  async delete(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid task ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },

  // Get tasks filtered by project
  async getByProject(projectId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("created_by", user.id)
      .eq("project", projectId)
      .order("deadline_at", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get time logs for a specific task
  async getTimeLogs(taskId) {
    if (!taskId || taskId === "undefined" || taskId === "null") {
      return []; // Return empty array for invalid task IDs
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("created_by", user.id)
      .eq("task", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get total duration for a task
  async getTotalDuration(taskId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select("duration")
      .eq("created_by", user.id)
      .eq("task", taskId);

    if (error) throw error;

    const totalDuration = data.reduce(
      (sum, log) => sum + (log.duration || 0),
      0
    );
    return totalDuration;
  },
};
