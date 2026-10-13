import type { SearchQuery, SearchResults } from "../types";

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResults>;
}
