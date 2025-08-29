import { supabase } from "../lib/supabase";

export const projectService = {
  // Get all projects (visible to all users)
  async getAll() {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        created_by_profile:profiles!projects_created_by_fkey(id, full_name),
        updated_by_profile:profiles!projects_updated_by_fkey(id, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single project by ID
  async getById(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new project
  async create(projectData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          ...projectData,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing project
  async update(id, projectData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .update({
        ...projectData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a project
  async delete(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },
};
