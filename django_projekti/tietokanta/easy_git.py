import os
		
class EasyGit():

	def __init__(path=None):
		if path is None:
			self.repo_path =  os.getcwd()
		self.repo_path = path

	def pull(self):
		__run_command__("git pull")

	def push(self):
		__run_command__("git push")

	def commit(self, message):
		__run_command__("git add .")
		__run_command__("git commit -m \"" + message +"\"")

	def __run_command__(self, command):
		return subprocess.call(command , shell=True, stdout=subprocess.PIPE, cwd=self.repo_path)