import { supabase } from "../lib/supabase";

export const activityService = {
  // Get all activities for the current user
  async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single activity by ID
  async getById(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid activity ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Activity not found");

    return data;
  },

  // Create a new activity
  async create(activityData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up activityData to avoid passing "undefined" strings
    const cleanedData = {};
    Object.keys(activityData).forEach((key) => {
      if (
        activityData[key] &&
        activityData[key] !== "undefined" &&
        activityData[key] !== "null"
      ) {
        cleanedData[key] = activityData[key];
      }
    });

    const { data, error } = await supabase
      .from("activities")
      .insert([
        {
          ...cleanedData,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing activity
  async update(id, activityData) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid activity ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up activityData to avoid passing "undefined" strings
    const cleanedData = {};
    Object.keys(activityData).forEach((key) => {
      if (
        activityData[key] &&
        activityData[key] !== "undefined" &&
        activityData[key] !== "null"
      ) {
        cleanedData[key] = activityData[key];
      }
    });

    const { data, error } = await supabase
      .from("activities")
      .update({
        ...cleanedData,
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

  // Delete an activity
  async delete(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid activity ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },
};
