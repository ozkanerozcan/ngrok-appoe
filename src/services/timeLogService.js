import { supabase } from "../lib/supabase";

export const timeLogService = {
  // Get all time logs for the current user with related project and location data
  async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        tasks:task (
          id,
          title
        ),
        locations:location (
          id,
          title
        )
      `
      )
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single time log by ID with related data
  async getById(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        tasks:task (
          id,
          title
        ),
        locations:location (
          id,
          title
        )
      `
      )
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Time log not found");

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

  // Create a new time log
  async create(timeLogData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Remove title from timeLogData since it's not in the database
    const { title, ...cleanData } = timeLogData;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("time_logs")
      .insert([
        {
          ...cleanData,
          created_by: user.id,
          updated_by: user.id,
          created_at: now,
          updated_at: now,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing time log
  async update(id, timeLogData, shouldArchive = false) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Remove title from timeLogData since it's not in the database
    const { title, ...cleanData } = timeLogData;

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        ...cleanData,
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

  // Delete a time log
  async delete(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("time_logs")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },

  // Get time logs filtered by project (via tasks)
  async getByProject(projectId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First get tasks for this project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id")
      .eq("created_by", user.id)
      .eq("project", projectId);

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return []; // No tasks for this project
    }

    const taskIds = tasks.map((task) => task.id);

    // Get time logs for these tasks
    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("created_by", user.id)
      .in("task", taskIds)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get time logs filtered by location
  async getByLocation(locationId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("created_by", user.id)
      .eq("location", locationId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get total duration for a project (via tasks)
  async getTotalDurationByProject(projectId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First get tasks for this project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id")
      .eq("created_by", user.id)
      .eq("project", projectId);

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return 0; // No tasks for this project
    }

    const taskIds = tasks.map((task) => task.id);

    // Get time logs for these tasks
    const { data, error } = await supabase
      .from("time_logs")
      .select("duration")
      .eq("created_by", user.id)
      .in("task", taskIds);

    if (error) throw error;

    const totalDuration = data.reduce(
      (sum, log) => sum + (log.duration || 0),
      0
    );
    return totalDuration;
  },

  // Get time logs filtered by task
  async getByTask(taskId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select("*")
      .eq("created_by", user.id)
      .eq("task", taskId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};
