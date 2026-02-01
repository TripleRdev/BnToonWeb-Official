import { useQuery } from "@tanstack/react-query";
import { dbQuery } from "@/lib/db";

interface SeriesGenreRelation {
  series_id: string;
  genre_id: string;
}

export function useSeriesGenresMap() {
  return useQuery({
    queryKey: ["series-genres-map"],
    queryFn: async () => {
      const { data, error } = await dbQuery<SeriesGenreRelation[]>("get_all_series_genres");
      if (error) throw new Error(error);
      
      const map: Record<string, string[]> = {};
      (data || []).forEach((sg) => {
        if (!map[sg.series_id]) map[sg.series_id] = [];
        map[sg.series_id].push(sg.genre_id);
      });
      
      return map;
    },
  });
}
