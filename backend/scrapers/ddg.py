from duckduckgo_search import DDGS

def search_song(query):
    results = DDGS().text("دانلود "+str(query), max_results=7)
    # print(results)
    return results

if __name__ == "__main__":
    print(search_song("sasy marmoulak"))

