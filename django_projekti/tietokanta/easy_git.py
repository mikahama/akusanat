import os
import subprocess
		
class EasyGit():

	def __init__(self, path=None):
		if path is None:
			self.repo_path =  os.getcwd()
		self.repo_path = path

	def pull(self):
		self.__run_command__("git pull")

	def push(self):
		self.__run_command__("git push")

	def commit(self, message):
		self.__run_command__("git add .")
		self.__run_command__("git commit -m \"" + message +"\"")

	def __run_command__(self, command):
		return subprocess.call(command , shell=True, stdout=subprocess.PIPE, cwd=self.repo_path)