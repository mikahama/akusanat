import os
import subprocess
import shutil
		
class EasyGit():

	def __init__(self, path=None):
		if path is None:
			self.repo_path =  os.getcwd()
		else:
			self.repo_path = path
		if not os.path.exists(self.repo_path):
			os.makedirs(self.repo_path)


	def pull(self):
		return self.__run_command__("git pull")

	def clone(self, remote_url):
		self.repo_path = os.path.abspath(os.path.join(self.repo_path, os.pardir))
		shutil.rmtree(self.repo_path)
		os.mkdir(self.repo_path)
		return self.__run_command__("git clone " + remote_url)
		"""
		p = subprocess.Popen("git clone " + remote_url, stdout=subprocess.PIPE, shell=True, cwd=self.repo_path)

		(output, err) = p.communicate()

		#This makes the wait possible
		p.wait()
		return output
		"""

	def set_user(self, user):
		self.__run_command__("git config user.name " + user)
		BASE_DIR = os.path.dirname(os.path.dirname(__file__))
		key_path = os.path.join(BASE_DIR, 'id_rsa')
		return self.__run_command__("git config core.sshCommand 'ssh -i "+ key_path+ "'")

	def push(self):
		return self.__run_command__("git push")

	def commit(self, message):
		self.__run_command__("git add .")
		return self.__run_command__("git commit -m \"" + message +"\"")

	def __run_command__(self, command):
		return subprocess.check_output(command , shell=True, cwd=self.repo_path, stderr=subprocess.STDOUT)