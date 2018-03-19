"""saame URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.conf import settings
from tietokanta import views
import re

prefix = getattr(settings, "URL_PREFIX", "")

urlpatterns = [
    url(r'^' + re.escape(prefix)+ r'xml_out/', views.xml_out, name='xml_out'),
    url(r'^' + re.escape(prefix)+ r'git_premerge/', views.dump_to_git, name='git_premerge'),
    url(r'^' + re.escape(prefix)+ r'deleteLemma/', views.delete_lemma, name='delete_lemma'),
    url(r'^' + re.escape(prefix)+ r'updateLemma/', views.update_lemma, name='update_lemma'),
    url(r'^' + re.escape(prefix)+ r'updateWiki/', views.process_towiki_queue, name='update_wiki'),
    url(r'^' + re.escape(prefix)+ r'git_postmerge/', views.pull_git, name='pull_git'),
    url(r'^' + re.escape(prefix)+ r'rebaseWiki/', views.rebase_wiki, name='rebase_wiki'),
    url(r'^' + re.escape(prefix)+ r'updateSystem/', views.update_system, name='update_system'),
    url(r'^' + re.escape(prefix)+ r'version/', views.version, name='version'),
    url(r'^' + re.escape(prefix)+ r'errorLog/', views.error_log, name='error_log'),
    url(r'^' + re.escape(prefix)+ r'testMongo/', views.test_mongo, name='test_mongo'),
    url(r'^' + re.escape(prefix)+ r'rsaKey/', views.rsa_key, name='rsa_key'),
    url(r'^' + re.escape(prefix)+ r'testGit/', views.test_git, name='test_git'),
    url(r'^' + re.escape(prefix)+ r'cloneGit/', views.clone_git, name='clone_git'),
    url(r'^' + re.escape(prefix)+ r'inflect/', views.inflect, name='inflect'),
    url(r'^' + re.escape(prefix)+ r'lemmatize/', views.lemmatize, name='lemmatize'),
    url(r'^' + re.escape(prefix)+ r'analyze/', views.analyse_word, name='analyze'),
    url(r'^' + re.escape(prefix)+ r'generate/', views.generate_form, name='generate'),
    url(r'^' + re.escape(prefix)+ r'listLemmas/', views.list_lemmas, name='list_lemmas'),
    url(r'^' + re.escape(prefix)+ r'listLanguages/', views.list_languages, name='list_languages'),
    url(r'^' + re.escape(prefix)+ r'search/', views.search, name='search'),
    url(r'^' + re.escape(prefix)+ r'downloadModel/', views.download_model, name='downloadModel')
]
