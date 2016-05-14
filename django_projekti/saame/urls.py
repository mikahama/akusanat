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
from tietokanta import views

urlpatterns = [
    url(r'^xml_out/', views.xml_out, name='xml_out'),
    url(r'^deleteLemma/', views.delete_lemma, name='delete_lemma'),
    url(r'^updateLemma/', views.update_lemma, name='update_lemma')
]
