from django.db import models

# Create your models here.
class WikiUpdateQueue(models.Model):
    lemma = models.CharField(max_length=500, primary_key=True)
    language = models.CharField(max_length=30)