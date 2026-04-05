namespace test_api.Controllers
{
	public class UsersController
    {
		private readonly Dictionary<string, string> _giftFor = new();      // кто кому дарит
		private readonly Dictionary<string, string> _wishes = new();       // пожелани€
		private readonly List<string> _users = new();                   // список участников


		public (string userName, string giftFor) RegisterUser(string name)
		{
			if (string.IsNullOrWhiteSpace(name))
				throw new ArgumentException("»м€ не может быть пустым");

			name = name.Trim();

			if (_users.Contains(name))
			{
				if (_giftFor.ContainsKey(name))
					return (name, _giftFor[name]);
				else
					throw new InvalidOperationException("ѕользователь зарегистрирован, но распределение еще не выполнено");
			}

			_users.Add(name);


			RegenerateAssignments();


			if (_giftFor.ContainsKey(name))
				return (name, _giftFor[name]);
			else
				return (name, string.Empty);

			
		}

		private void RegenerateAssignments()
		{
			if (_users.Count < 2)
			{
				_giftFor.Clear();
				return;
			}

			var usersList = _users.ToList();
			var shuffled = usersList.OrderBy(_ => Guid.NewGuid()).ToList();

			for (int i = 0; i < shuffled.Count; i++)
			{
				if (shuffled[i] == shuffled[(i + 1) % shuffled.Count])
				{
					RegenerateAssignments();
					return;
				}
			}

			_giftFor.Clear();
			for (int i = 0; i < shuffled.Count; i++)
			{
				string giver = shuffled[i];
				string receiver = shuffled[(i + 1) % shuffled.Count];
				_giftFor[giver] = receiver;
			}
		}

		public void SaveWish(string name, string wish)
		{
			if (string.IsNullOrWhiteSpace(name))
				throw new ArgumentException("»м€ не может быть пустым");

			name = name.Trim();

			if (!_users.Contains(name))
				throw new KeyNotFoundException($"ѕользователь '{name}' не найден");

			_wishes[name] = wish ?? string.Empty;
		}

		public (string name, string wish) GetWish(string name)
		{
			if (string.IsNullOrWhiteSpace(name))
				throw new ArgumentException("»м€ не может быть пустым");

			name = name.Trim();

			if (!_users.Contains(name))
				throw new KeyNotFoundException($"ѕользователь '{name}' не найден");

			var wish = _wishes.GetValueOrDefault(name, string.Empty);
			return (name, wish);
		}
	}
}