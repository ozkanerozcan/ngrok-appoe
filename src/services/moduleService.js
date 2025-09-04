import { supabase } from "../lib/supabase";

export const moduleService = {
  // Get all modules for the current user
  async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single module by ID
  async getById(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid module ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Module not found");

    return data;
  },

  // Create a new module
  async create(moduleData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up moduleData to avoid passing "undefined" strings
    const cleanedData = {};
    Object.keys(moduleData).forEach((key) => {
      if (
        moduleData[key] &&
        moduleData[key] !== "undefined" &&
        moduleData[key] !== "null"
      ) {
        cleanedData[key] = moduleData[key];
      }
    });

    const { data, error } = await supabase
      .from("modules")
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

  // Update an existing module
  async update(id, moduleData) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid module ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Clean up moduleData to avoid passing "undefined" strings
    const cleanedData = {};
    Object.keys(moduleData).forEach((key) => {
      if (
        moduleData[key] &&
        moduleData[key] !== "undefined" &&
        moduleData[key] !== "null"
      ) {
        cleanedData[key] = moduleData[key];
      }
    });

    const { data, error } = await supabase
      .from("modules")
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

  // Delete a module
  async delete(id) {
    if (!id || id === "undefined" || id === "null") {
      throw new Error("Invalid module ID provided");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },
};
