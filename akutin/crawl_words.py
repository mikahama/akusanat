import scrapy

#scrapy runspider crawl_words.py -o kpv.json -t json

lang = "kpv"
url = "https://www.akusanat.com/index.php?title=Special%3APrefixIndex&prefix="+lang+"&namespace=0"
class BlogSpider(scrapy.Spider):
    name = 'blogspider'
    start_urls = [url]

    def parse(self, response):
        xpath = '//*[@id="mw-content-text"]/div/ul/li/a/text()'
        for text in response.xpath(xpath):
            yield {'text': text.get()}

        xpath = "/html/body/div[3]/div[2]/div[3]/div[4]/a"
        for next_page in response.xpath(xpath):
            if "Next page" in next_page.get():
                yield response.follow(next_page, self.parse)
