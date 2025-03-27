import requests
from bs4 import BeautifulSoup
try:
    import scrapers.ddg as ddg
    with open('scrapers/shittysites.txt', 'r') as f:
        banlist = f.read().splitlines()
except:
    import ddg
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
            # print("i is "+str(i))
            try:
                if '256' in i and i.endswith('.mp3'):
                    links.append(i)
            except:
                pass

        if links:
            return {"result": True, "link": links[0]}
        else:
            # priorities = ['192', '160', '128', '96']
            # for priority in priorities:
            for i in a_tags:
                try:
                    if '128' in i and i.endswith('.mp3'):
                        return {"result": True, "link": i}
                except:
                    pass
            if len(a_tags) > 0:
                if a_tags[-1].endswith('.mp3'):
                    return {"result": True, "link": a_tags[-1]}
            

        # mp3_links = [i for i in response.text.split() if i.startswith('http') and i.endswith('.mp3')]
        # for mp3_links:
        return {"result": False, "link": ""}
    else:
        return {"result": False, "link": ""}



    
    # return url

def grab_song(query):
    attempts = 2
    print("grabbing "+query)
    results = ddg.search_song(query)
    # return results
    links = []
    for i in results:
        if "دانلود" in i["title"]:
            # print("grabbing from "+i["href"])
            z = grab_mp3(i["href"])
            # print("busy")
            print("grabbed from "+i["href"]+", result was "+str(z["result"]))
            if z["result"] == True:
                # print(z["link"])
                links.append(z["link"])
        else:
            continue
    return links

if __name__ == "__main__":
    # print(grab_mp3("https://emusicfa.ir/sasy-marmolk/"))
    print(grab_song("Nang Be Neyrang To Amir Tataloo"))