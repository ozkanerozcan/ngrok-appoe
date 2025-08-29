import { supabase } from "../lib/supabase";

export const locationService = {
  // Get all locations (visible to all users)
  async getAll() {
    const { data, error } = await supabase
      .from("locations")
      .select(
        `
        *,
        created_by_profile:profiles!locations_created_by_fkey(id, full_name),
        updated_by_profile:profiles!locations_updated_by_fkey(id, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single location by ID
  async getById(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new location
  async create(locationData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          ...locationData,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing location
  async update(id, locationData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("locations")
      .update({
        ...locationData,
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

  // Delete a location
  async delete(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },
};
