import faker.providers.misc as misc


def get_uuid() -> str:
    return str(misc.uuid.uuid4())
