import ddg
import requests
from bs4 import BeautifulSoup
with open('shittysites.txt', 'r') as f:
    banlist = f.read().splitlines()

def grab_mp3(url):
    if any(site in url for site in banlist):
        return {"result": False, "link": ""}

    response = requests.get(url)
    if response.status_code == 200:
        # anal
        soup = BeautifulSoup(response.text, 'html.parser')
        audio_tags = soup.find_all('audio')
        # links = []
        for tag in audio_tags:
            try:
                src = tag.find('source').get('src')
                # print("reached 1", audio_tags)
                if src and src.endswith('.mp3'):
                    # links.append(src)
                    # print("reached 2")
                    return {"result": True, "link": src}
            except:
                pass       
        
        # mp3_links = [i for i in response.text.split() if i.startswith('http') and i.endswith('.mp3')] + links
        a_tags = [a.get('href') for a in soup.find_all('a')]
        
        links = []
        for i in a_tags:
            if '256' in i and i.endswith('.mp3'):
                links.append(i)
        
        if links:
            return {"result": True, "link": links[0]}
        else:
            # priorities = ['192', '160', '128', '96']
            # for priority in priorities:
            for i in a_tags:
                if '128' in i and i.endswith('.mp3'):
                    return {"result": True, "link": i}
            if len(a_tags) > 0 and a_tags[-1].endswith('.mp3'):
                return {"result": True, "link": a_tags[-1]}
            

        # mp3_links = [i for i in response.text.split() if i.startswith('http') and i.endswith('.mp3')]
        # for mp3_links:
        return {"result": False, "link": ""}
        # return {"result": True, "links": mp3_links}
        


    
    # return url

def grab_song(query):
    results = ddg.search_song(query)
    # return results
    links = []
    for i in results:
        if "دانلود" in i["title"]:
            z = grab_mp3(i["href"])
            if z["result"] == True:
                links.append(z["link"])
        else:
            continue

if __name__ == "__main__":
    print(grab_mp3("https://emusicfa.ir/sasy-marmolk/"))